import {dirnameFromImportMeta, runCommand, packageDirname} from "../utils/node-util.js";
import {DeclaredError} from "../utils/js-util.js";
import path from "path";
import fs from "fs";
import {loadHookChannel, HookEvent} from "hook-channel";
import {peabind, peabindMerge, peabindGetLibConf} from "peabind";
import {escapeCString, unindent, autoIndent} from "../utils/lang-util.js";
import JSON5 from "json5";
import PeakernelBuildEvent from "./PeakernelBuildEvent.js";
import {peakernelLoadHookChannel} from "./peakernel-commands.js";
import {pioParse, pioStringify, pioGetEnvNames, pioGetEnv, pioEnvNormalize} from "../utils/pio-util.js";

let __dirname=dirnameFromImportMeta(import.meta);

class PeakernelFlasher {
    constructor({cwd, port, dryRun}) {
        if (!port)
            throw new DeclaredError("No port specified.");

        this.cwd=cwd;
        this.port=port;
        this.targetPath=path.join(this.cwd,".target");
        this.dryRun=dryRun;
    }

    generateSrcExt(ev) {
        fs.mkdirSync(path.join(this.targetPath,"src-ext"),{recursive: true});

        let sources=[];
        for (let source of ev.sources) {
            let stats=fs.statSync(source);

            if (stats.isFile()) {
                let name=path.basename(source);
                let linkToName=path.join(this.targetPath,"src-ext",name);
                if (!fs.existsSync(linkToName))
                    fs.symlinkSync(source,linkToName);

                sources.push(linkToName);
            }

            else {
                sources.push(source);
            }
        }

        sources.push(path.join(this.targetPath,"src-ext"));

        ev.sources=sources;
    }

    generateCmake(ev) {
        let topCmakeContent=unindent(`
            cmake_minimum_required(VERSION 3.16)
            include($ENV{IDF_PATH}/tools/cmake/project.cmake)
            project(peakernel)            
        `);
        fs.writeFileSync(path.join(this.targetPath,"CMakeLists.txt"),topCmakeContent);

        fs.mkdirSync(path.join(this.targetPath,"src"),{recursive: true});
        let sources=[];
        for (let source of ev.sources) {
            let stats=fs.statSync(source);

            if (stats.isFile()) {
                sources.push(source);
            }

            else {
                for (let entry of fs.readdirSync(source))
                    if (entry.endsWith(".c") || entry.endsWith(".cpp"))
                        sources.push(path.join(source,entry));
            }
        }

        let projectCmakeContent=autoIndent(`
            idf_component_register(
                SRCS
                    ${sources.map(d=>`"${d}"\n`).join("\n")}
                INCLUDE_DIRS
                    ${ev.includeDirs.map(d=>`"${d}"\n`).join("\n")}
            )
        `);

        fs.writeFileSync(path.join(this.targetPath,"src","CMakeLists.txt"),projectCmakeContent);
    }

    generatePlatformioIni(ev) {
        let ini=pioParse(fs.readFileSync(path.join(this.cwd,"platformio.ini"),"utf8"));
        if (pioGetEnvNames(ini).length!=1)
            throw new Error("Expectd exactly one env in platformio.ini");

        let env=pioEnvNormalize(pioGetEnv(ini,pioGetEnvNames(ini)[0]));
        env.upload_port=this.port;
        env.monitor_port=this.port;
        env.monitor_speed=115200;
        env.build_unflags.push("-std=gnu++11");
        env.build_flags.push(...[
            "-std=c++17",
            "-DJS_STRICT_NAN_BOXING",
            "-DJS_NO_REGEXP",
            "-DJS_NO_MODULE_LOADER",
            "-DJS_NO_OS",
            `-DCONFIG_VERSION=\\"embedded\\"`,
            "-DEMSCRIPTEN",
            "-DJSVAL_TARGET_QUICKJS",
            ...ev.includeDirs.map(d=>`-I${d}`),
            ...Object.entries(ev.defines).map(([k,v])=>`-D${k}${v?"="+v:""}`),
        ]);

        if (env.build_src_filter)
            throw new DeclaredError("Don't specify build_src_filter");

        switch (env.framework) {
            case "arduino":
                ev.addSource(path.join(__dirname,"../../src/main-arduino.cpp"));
                this.generateSrcExt(ev);
                env.build_src_filter=[
                    "-<*>",
                    ...ev.sources.map(s=>`+<${s}>`)
                ];
                env.build_flags.push(...[
                    "-DARDUINO_USB_MODE=1",
                    "-DARDUINO_USB_CDC_ON_BOOT=1"
                ]);
                break;

            case "espidf":
                ev.addSource(path.join(__dirname,"../../src/main-espidf.cpp"));
                this.generateCmake(ev);
                env.build_unflags.push("-Werror=all");
                env.build_flags.push("-Wno-error=incompatible-pointer-types");
                env.build_flags.push("-fpermissive");
                break;

            default:
                throw new DeclaredError("Unknown framework: "+env.framework);
        }

        let iniContent=pioStringify(ini);
        fs.writeFileSync(path.join(this.targetPath,"platformio.ini"),iniContent);
    }

    async createBuildEvent() {
        let hookChannel=await peakernelLoadHookChannel({cwd: this.cwd});
        let ev=await hookChannel.dispatch(new PeakernelBuildEvent());

        ev.addIncludeDir(this.targetPath);
        ev.addIncludeDir(path.join(__dirname,"../../src"));
        ev.addSource(this.targetPath);
        ev.addSource(path.join(__dirname,"../../src/peakernel.cpp"));

        ev.addIncludeDir(peabindGetLibConf("includeDir"));
        ev.addIncludeDir(path.join(__dirname,"../../vendor/quickjs"));
        ev.addSource(path.join(__dirname,"../../vendor/quickjs"));
        for (let source of peabindGetLibConf("sources",{target: "quickjs"}))
            ev.addSource(source);

        return ev;
    }

    loadJsonIfFilename(filenameOrObject) {
        if (typeof filenameOrObject=="string")
            filenameOrObject=JSON5.parse(fs.readFileSync(filenameOrObject));

        return filenameOrObject;
    }

    makeRelativeIfFile(fileOrDir) {
        return fileOrDir;

        if (fs.statSync(fileOrDir).isDirectory())
            return fileOrDir;

        return path.relative(this.targetPath,fileOrDir);
    }

    generatePeakernelMain(ev) {
        return autoIndent(`
            extern "C" {
                ${ev.setupFunctions.map(f=>`void ${f}();`).join("\n")}
                ${ev.loopFunctions.map(f=>`void ${f}();`).join("\n")}
                ${ev.getStartFunctions().map(f=>`void ${f}();`).join("\n")}
                ${ev.getStopFunctions().map(f=>`void ${f}();`).join("\n")}

                void peakernel_notify_setup() {
                    ${ev.setupFunctions.map(f=>`${f}();`).join("\n")}
                }

                void peakernel_notify_loop() {
                    ${ev.loopFunctions.map(f=>`${f}();`).join("\n")}
                }

                void peakernel_notify_start() {
                    ${ev.getStartFunctions().map(f=>`${f}();`).join("\n")}
                }

                void peakernel_notify_stop() {
                    ${ev.getStopFunctions().map(f=>`${f}();`).join("\n")}
                }
            }
        `);
    }

    generateBootContent(ev, main) {
        let mainContent="";
        if (main)
            mainContent=`globalThis.bootFunction=()=>{${fs.readFileSync(main,"utf8")}};`;

        let content=`
            ${ev.bootContent}
            ${ev.getBootFiles().map(f=>fs.readFileSync(f,"utf8")).join("\n")}
            ${mainContent}
        `;

        return `const char boot_js[]="${escapeCString(content)}";`;
    }
}

export async function peakernelFlash({cwd, port, dryRun, args, main}) {
    cwd=packageDirname(cwd);

    if (args[0])
        main=args[0];

    else if (main)
        main=path.resolve(cwd,main);

    let flasher=new PeakernelFlasher({cwd, port, dryRun});
    let ev=await flasher.createBuildEvent();

    if (!fs.existsSync(path.join(cwd,"platformio.ini")))
        throw new DeclaredError("No platformio.ini");

    fs.mkdirSync(flasher.targetPath,{recursive: true});

    await peabind({
        idl: peabindMerge(ev.bindings.map(b=>flasher.loadJsonIfFilename(b))),
        target: "quickjs",
        output: path.join(flasher.targetPath,"pk_bindings.cpp"),
        prefix: "pk_bindings_"
    });

    let bootFile;
    if (!ev.externalBootFile)
        bootFile=main;

    let boot=flasher.generateBootContent(ev,bootFile);
    fs.writeFileSync(path.join(flasher.targetPath,"boot_js.c"),boot);

    let peakernelMainSource=flasher.generatePeakernelMain(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"peakernel_main.cpp"),peakernelMainSource);

    await flasher.generatePlatformioIni(ev);

    if (!dryRun) {
        await runCommand("pio",["run","--target","upload"],{cwd: flasher.targetPath});
    }
}