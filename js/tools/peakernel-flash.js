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
import {parse as iniParse} from "ini";

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

    generatePlatformioIni(ev) {
        let port=this.port;
        let includeDirs=ev.includeDirs;

        //console.log(includeDirs);

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

        return unindent(`
            [env:peakernel]
            platform = espressif32
            board = esp32-c3-devkitm-1
            framework = arduino
            build_unflags = -std=gnu++11  # remove the default
            build_flags = 
                -DARDUINO_USB_MODE=1
                -DARDUINO_USB_CDC_ON_BOOT=1 
                -std=c++17
                -DJS_STRICT_NAN_BOXING
                -DJS_NO_REGEXP
                -DJS_NO_MODULE_LOADER
                -DJS_NO_OS
                -DCONFIG_VERSION=\\"embedded\\"
                -DEMSCRIPTEN
                -DJSVAL_TARGET_QUICKJS
                ${"\n"+includeDirs.map(d=>`${" ".repeat(16)}-I${d}`).join("\n")}
                ${"\n"+Object.entries(ev.defines).map(([k,v])=>`${" ".repeat(16)}-D${k}=${v?v:""}`).join("\n")}
            monitor_speed = 115200
            upload_port=${port}
            monitor_port=${port}
            build_src_filter =
                -<*>
                ${"\n"+sources.map(d=>`${" ".repeat(16)}+<${d}>`).join("\n")}
        `+"\n");
    }

    async createBuildEvent() {
        let hookChannel=await peakernelLoadHookChannel({cwd: this.cwd});
        let ev=await hookChannel.dispatch(new PeakernelBuildEvent());

        ev.addIncludeDir(this.targetPath);
        ev.addIncludeDir(path.join(__dirname,"../../src"));
        ev.addSource(path.join(__dirname,"../../src"));
        ev.addSource(this.targetPath);

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

    generateBootContent(ev) {
        let content=`
            ${ev.bootContent}
            ${ev.getBootFiles().map(f=>fs.readFileSync(f,"utf8")).join("\n")}
        `;

        return `const char boot_js[]="${escapeCString(content)}";`;
    }
}

export async function peakernelFlash({cwd, port, dryRun}) {
    cwd=packageDirname(cwd);
    console.log("cwd: "+cwd);

    let flasher=new PeakernelFlasher({cwd, port, dryRun});
    let ev=await flasher.createBuildEvent();

    if (!fs.existsSync(path.join(cwd,"platformio.ini")))
        throw new DeclaredError("No platformio.ini");

    let ini=iniParse(fs.readFileSync(path.join(cwd,"platformio.ini"),"utf8"));
    console.log(ini);

    /*fs.mkdirSync(flasher.targetPath,{recursive: true});

    await peabind({
        idl: peabindMerge(ev.bindings.map(b=>flasher.loadJsonIfFilename(b))),
        target: "quickjs",
        output: path.join(flasher.targetPath,"pk_bindings.cpp"),
        prefix: "pk_bindings_"
    });

    let boot=flasher.generateBootContent(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"boot_js.c"),boot);

    let iniSource=flasher.generatePlatformioIni(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"platformio.ini"),iniSource);

    let peakernelMainSource=flasher.generatePeakernelMain(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"peakernel_main.cpp"),peakernelMainSource);

    if (!dryRun) {
        await runCommand("pio",["run","--target","upload"],{cwd: flasher.targetPath});
    }*/
}