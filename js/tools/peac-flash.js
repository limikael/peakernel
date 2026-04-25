import {dirnameFromImportMeta, runCommand, packageDirname} from "../utils/node-util.js";
import {DeclaredError} from "../utils/js-util.js";
import path from "path";
import fs from "fs";
import {loadHookChannel, HookEvent} from "hook-channel";
import {peabind, peabindMerge, peabindGetLibConf} from "peabind";
import {escapeCString, unindent, autoIndent} from "../utils/lang-util.js";
import JSON5 from "json5";
import PeacBuildEvent from "./PeacBuildEvent.js";
import {peacLoadHookChannel} from "./peac-commands.js";

let __dirname=dirnameFromImportMeta(import.meta);

class PeacFlasher {
    constructor({cwd, port}) {
        if (!port)
            throw new DeclaredError("No port specified.");

        this.port=port;
        this.cwd=packageDirname(cwd);
        this.targetPath=path.join(this.cwd,".target");
    }

    generatePlatformioIni(ev) {
        let port=this.port;
        let includeDirs=ev.includeDirs;

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
            [env:peac]
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
            monitor_speed = 115200
            upload_port=${port}
            monitor_port=${port}
            build_src_filter =
                -<*>
                ${"\n"+sources.map(d=>`${" ".repeat(16)}+<${d}>`).join("\n")}
        `+"\n");
    }

    async createBuildEvent() {
        /*let hookChannel=await loadHookChannel({
            cwd: this.cwd,
            keyword: "peac-plugin",
            exportPath: "peac-build-hooks",
            extraModuleDirs: path.join(__dirname,"../../packages")
        });*/

        let hookChannel=await peacLoadHookChannel({cwd: this.cwd});
        let ev=await hookChannel.dispatch(new PeacBuildEvent());

        ev.addBootFile(path.join(__dirname,"../firmware/boot.js"));
        ev.addBinding(path.join(__dirname,"../firmware/bindings.json"));
        ev.addBinding(path.join(__dirname,"../firmware/engine-bindings.json"));
        ev.addIncludeDir(peabindGetLibConf("includeDir"));
        ev.addIncludeDir(path.join(__dirname,"../../vendor/quickjs"));
        ev.addIncludeDir(this.targetPath);
        ev.addIncludeDir(path.join(__dirname,"../../src"));
        ev.addSource(path.join(__dirname,"../../vendor/quickjs"));
        ev.addSource(path.join(__dirname,"../../src"));
        ev.addSource(this.targetPath);

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

    generatePeacMain(ev) {
        return autoIndent(`
            extern "C" {
                ${ev.setupFunctions.map(f=>`void ${f}();`).join("\n")}
                ${ev.loopFunctions.map(f=>`void ${f}();`).join("\n")}
                ${ev.startFunctions.map(f=>`void ${f}();`).join("\n")}
                ${ev.stopFunctions.map(f=>`void ${f}();`).join("\n")}

                void peac_notify_setup() {
                    ${ev.setupFunctions.map(f=>`${f}();`).join("\n")}
                }

                void peac_notify_loop() {
                    ${ev.loopFunctions.map(f=>`${f}();`).join("\n")}
                }

                void peac_notify_start() {
                    ${ev.startFunctions.map(f=>`${f}();`).join("\n")}
                }

                void peac_notify_stop() {
                    ${ev.stopFunctions.map(f=>`${f}();`).join("\n")}
                }
            }
        `);
    }

    generateBootContent(ev) {
        let content=`
            ${ev.bootContent}
            ${ev.bootFiles.map(f=>fs.readFileSync(f,"utf8")).join("\n")}
        `;

        return `const char boot_js[]="${escapeCString(content)}";`;
    }
}

export async function peacFlash({cwd, port}) {
    let flasher=new PeacFlasher({cwd, port});

    let ev=await flasher.createBuildEvent();
    fs.mkdirSync(flasher.targetPath,{recursive: true});

    await peabind({
        idl: peabindMerge(ev.bindings.map(b=>flasher.loadJsonIfFilename(b))),
        target: "quickjs",
        output: path.join(flasher.targetPath,"peac_bindings.cpp"),
        prefix: "peac_bindings_"
    });

    let boot=flasher.generateBootContent(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"boot_js.c"),boot);

    let iniSource=flasher.generatePlatformioIni(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"platformio.ini"),iniSource);

    let peacMainSource=flasher.generatePeacMain(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"peac_main.cpp"),peacMainSource);

    await runCommand("pio",["run","--target","upload"],{cwd: flasher.targetPath});
}