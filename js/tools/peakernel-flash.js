import {dirnameFromImportMeta, runCommand, packageDirname} from "../utils/node-util.js";
import {DeclaredError} from "../utils/js-util.js";
import path from "path";
import fs from "fs";
import {loadHookChannel, HookEvent} from "hook-channel";
import {peabind, peabindMerge, peabindGetLibConf} from "peabind";
import {escapeCString, unindent, autoIndent, createIniContent} from "../utils/lang-util.js";
import JSON5 from "json5";
import PeakernelBuildEvent from "./PeakernelBuildEvent.js";
import {peakernelLoadHookChannel} from "./peakernel-commands.js";

let __dirname=dirnameFromImportMeta(import.meta);

class PeakernelFlasher {
    constructor({cwd, port, dryRun}) {
        if (!port)
            throw new DeclaredError("No port specified.");

        this.port=port;
        this.cwd=packageDirname(cwd);
        this.targetPath=path.join(this.cwd,".target");
    }

    createSrcExt(ev) {
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

    generatePlatformioIni(ev) {
        let platformioIni={
            platformio: {
                src_dir: "main"
            },
            "env:peakernel": {
                ...ev.platformioIniItems,
                board: "esp32-c3-devkitm-1",
                build_unflags: [
                    "-std=gnu++11",
                    ...ev.buildUnflags
                ],
                build_flags: [
                    "-std=c++17",
                    "-DJS_STRICT_NAN_BOXING",
                    "-DJS_NO_REGEXP",
                    "-DJS_NO_MODULE_LOADER",
                    "-DJS_NO_OS",
                    `-DCONFIG_VERSION=\\"embedded\\"`,
                    "-DEMSCRIPTEN",
                    "-DJSVAL_TARGET_QUICKJS",
                    ...ev.buildFlags,
                    ...ev.includeDirs.map(i=>`-I${i}`),
                    ...Object.entries(ev.defines).map(([k,v])=>v?`-D${k}=${v}`:`-D${k}`)
                ],
                monitor_speed: 115200,
                upload_port: this.port,
                monitor_port: this.port,
            }
        };

        if (ev.buildBackend!="cmake") {
            platformioIni["env:peakernel"].build_src_filter=[
                "-<*>",
                ...ev.sources.map(d=>`+<${d}>`),
            ];
        }

        return createIniContent(platformioIni);

        /*return unindent(`
            [platformio]
            src_dir = main
            [env:peakernel]
            board = esp32-c3-devkitm-1
            ${"\n"+Object.entries(ev.platformioIniItems).map(([k,v])=>`${" ".repeat(12)}${k} = ${v}`).join("\n")}
            build_unflags = 
                -std=gnu++11  # remove the default
                ${"\n"+ev.buildUnflags.map(d=>`${" ".repeat(16)}${d}`).join("\n")}
            build_flags = 
                ${"\n"+ev.buildFlags.map(d=>`${" ".repeat(16)}${d}`).join("\n")}
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
                ${"\n"+ev.sources.map(d=>`${" ".repeat(16)}+<${d}>`).join("\n")}
        `+"\n");*/
    }

    generateTopCMake(ev) {
        return unindent(`
            cmake_minimum_required(VERSION 3.16)
            include($ENV{IDF_PATH}/tools/cmake/project.cmake)
            project(peakernel)            
        `);
    }

    generateProjectCMake(ev) {
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

        return autoIndent(`
            idf_component_register(
                SRCS
                    ${sources.map(d=>`"${d}"\n`).join("\n")}
                INCLUDE_DIRS
                    ${ev.includeDirs.map(d=>`"${d}"\n`).join("\n")}
            )
        `);
    }

    async createBuildEvent() {
        let hookChannel=await peakernelLoadHookChannel({cwd: this.cwd});
        let ev=await hookChannel.dispatch(new PeakernelBuildEvent());

        ev.addIncludeDir(this.targetPath);
        ev.addIncludeDir(path.join(__dirname,"../../src"));
        ev.addSource(path.join(__dirname,"../../src"));
        ev.addSource(this.targetPath);

        // this should go into the quickjs module!!! 
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
    let flasher=new PeakernelFlasher({cwd, port});

    let ev=await flasher.createBuildEvent();
    if (!ev.buildBackend)
        throw new DeclaredError("No build plugin!");

    fs.mkdirSync(flasher.targetPath,{recursive: true});

    // this should go into the quickjs module!!! 
    await peabind({
        idl: peabindMerge(ev.bindings.map(b=>flasher.loadJsonIfFilename(b))),
        target: "quickjs",
        output: path.join(flasher.targetPath,"pk_bindings.cpp"),
        prefix: "pk_bindings_"
    });

    if (ev.buildBackend=="cmake") {
        fs.mkdirSync(path.join(flasher.targetPath,"main"),{recursive: true});

        let topCmake=flasher.generateTopCMake();
        fs.writeFileSync(path.join(flasher.targetPath,"CMakeLists.txt"),topCmake);

        let projectCmake=flasher.generateProjectCMake(ev);
        fs.writeFileSync(path.join(flasher.targetPath,"main","CMakeLists.txt"),projectCmake);
    }

    if (ev.buildBackend=="platformio") {
        await flasher.createSrcExt(ev);
    }

    let boot=flasher.generateBootContent(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"boot_js.c"),boot);

    let iniSource=flasher.generatePlatformioIni(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"platformio.ini"),iniSource);

    let peakernelMainSource=flasher.generatePeakernelMain(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"peakernel_main.cpp"),peakernelMainSource);

    if (!dryRun) {
        await runCommand("pio",["run","--target","upload"],{cwd: flasher.targetPath});
    }
}