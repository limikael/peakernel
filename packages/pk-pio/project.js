import {runCommand, dirnameFromImportMeta, updateFile, packageDirname} from "../../js/utils/node-util.js";
import {autoIndent} from "../../js/utils/lang-util.js";
import fs from "node:fs";
import path from "node:path";
import {pioParse, pioStringify, pioGetEnvNames, pioGetEnv, pioEnvNormalize} from "../../js/utils/pio-util.js";

let __dirname=dirnameFromImportMeta(import.meta);

async function generateSrcExt(ev) {
    fs.mkdirSync(path.join(ev.targetPath,"src-ext"),{recursive: true});

    let sources=[];
    for (let source of ev.sources) {
        let stats=fs.statSync(source);
        if (!stats.isFile())
            throw new Error("Source should be a file...");

        let name=path.basename(source);
        let linkToName=path.join(ev.targetPath,"src-ext",name);
        if (!fs.existsSync(linkToName))
            fs.symlinkSync(source,linkToName);

        sources.push(linkToName);
    }

    sources.push(path.join(ev.targetPath,"src-ext"));

    ev.sources=sources;
}

async function generatePlatformioIni(ev) {
    let ini;
    if (ev.cwd && fs.existsSync(path.join(ev.cwd,"platformio.ini")))
        ini=pioParse(fs.readFileSync(path.join(ev.cwd,"platformio.ini"),"utf8"));

    else
        ini={"env:default": {}};

    if (pioGetEnvNames(ini).length!=1)
        throw new Error("Expectd exactly one env in platformio.ini");

    let env=pioEnvNormalize(pioGetEnv(ini,pioGetEnvNames(ini)[0]));
    //env.lib_ldf_mode = "deep+";
    if (!env.platform)
        env.platform="espressif32";

    if (!env.framework)
        env.framework="arduino";

    if (ev.board)
        env.board=ev.board;

    if (ev.board)
        env.board=ev.board;

    if (!env.board)
        throw new DeclaredError("No board selected (pass on the cmd line, or set in .env");

    env.upload_port=ev.port;
    env.monitor_port=ev.port;
    env.monitor_speed=115200;
    env.build_unflags.push("-std=gnu++11");
    env.build_flags.push(...[
        "-std=c++17",
        ...ev.includeDirs.map(d=>`-I${d}`),
        ...Object.entries(ev.defines).map(([k,v])=>`-D${k}${v?`=${v}`:""}`),
    ]);

    if (!env.lib_deps)
        env.lib_deps=[];

    env.lib_deps.push(...ev.libDeps);

    if (env.build_src_filter)
        throw new DeclaredError("Don't specify build_src_filter");

    if (env.framework!="arduino")
        throw new Error("Only arduino supported with pio");

    env.build_src_filter=[
        "-<*>",
        `+<${path.join(ev.targetPath,"src-ext")}>`
        //...ev.sources.map(s=>`+<${s}>`)
    ];
    env.build_flags.push(...[
        "-DARDUINO_USB_MODE=1",
        "-DARDUINO_USB_CDC_ON_BOOT=1"
    ]);

    let iniContent=pioStringify(ini);
    fs.writeFileSync(path.join(ev.targetPath,"platformio.ini"),iniContent);
}

export async function postbuild(ev) {
	//console.log("IDF build: "+ev.targetPath); //+" dryRun: "+ev.dryRun);
    ev.addSource(path.join(__dirname,"../../src/main-arduino.cpp"));

    await generateSrcExt(ev);
    await generatePlatformioIni(ev);

    if (!ev.dryRun)
        await runCommand("pio",["run","--target","upload"],{cwd: ev.targetPath});
}

export async function monitor({cwd, port, targetDir}) {
    cwd=packageDirname(cwd);
    let targetPath;

    if (targetDir)
        targetPath=targetDir;

    else if (cwd)
        targetPath=path.join(cwd,".target");

    else
        targetPath=path.join(os.tmpdir(),"peakernel-tmp",".target");

    await runCommand("pio",["device","monitor"],{cwd: targetPath});
}
