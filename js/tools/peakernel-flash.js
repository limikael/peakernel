import {dirnameFromImportMeta, runCommand, packageDirname} from "../utils/node-util.js";
import {DeclaredError} from "../utils/js-util.js";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {peabind, peabindMerge, peabindGetLibConf} from "peabind";
import {escapeCString, unindent, autoIndent} from "../utils/lang-util.js";
import JSON5 from "json5";
import PeakernelBuildEvent from "./PeakernelBuildEvent.js";
import {Command, Option, program} from "commander";
import {chainAttachCommanderCommand} from "chain-import";
import {resolveDeployFile, PeakernelBundler} from "./peakernel-deploy.js";

let __dirname=dirnameFromImportMeta(import.meta);

class PeakernelFlasher {
    constructor({cwd, port, dryRun, args, main, chain, board, targetDir}) {
        if (!port)
            throw new DeclaredError("No port specified.");

        this.args=args;
        this.main=main;
        this.board=board;
        this.chain=chain;
        this.cwd=cwd;
        this.port=port;
        this.dryRun=dryRun;

        if (targetDir)
            this.targetPath=targetDir;

        else if (this.cwd)
            this.targetPath=path.join(this.cwd,".target");

        else
            this.targetPath=path.join(os.tmpdir(),"peakernel-tmp",".target");
    }

    async createBuildEvent() {
        let ev=new PeakernelBuildEvent();
        ev.targetPath=this.targetPath;
        ev.board=this.board;
        ev.port=this.port;
        ev.dryRun=this.dryRun;
        ev.cwd=this.cwd;

        await this.chain.build(ev);

        ev.addIncludeDir(this.targetPath);
        ev.addIncludeDir(path.join(__dirname,"../../src"));
        ev.addIncludeDir(peabindGetLibConf("includeDir"));

        ev.addSource(path.join(this.targetPath,"boot_js.c"));
        ev.addSource(path.join(this.targetPath,"peakernel_main.cpp"));
        ev.addSource(path.join(this.targetPath,"pk_bindings.cpp"));

        return ev;
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

    async generateBootContent(ev) {
        let bootfunctionContent="";

        if (!await this.chain.canBootFromFile()) {
            let deployFile=resolveDeployFile({cwd: this.cwd, main: this.main, args: this.args});
            if (deployFile) {
                console.log("Bundling with firmware: "+deployFile);
                let bundler=new PeakernelBundler({cwd: this.cwd, chain: this.chain, main: deployFile});
                let bundleContent=await bundler.getBundleAiife();
                console.log("Bundle: "+bundleContent.length+" bytes");
                bootfunctionContent=`globalThis.bootFunction=()=>${bundleContent};`;
            }
        }

        let content=`
            ${bootfunctionContent}
            ${await ev.getBootContent()}
        `;

        return `const char boot_js[]="${escapeCString(content)}";`;
    }
}

function loadJsonIfFilename(filenameOrObject) {
    if (typeof filenameOrObject=="string")
        filenameOrObject=JSON5.parse(fs.readFileSync(filenameOrObject));

    return filenameOrObject;
}

export async function flash({cwd, port, dryRun, args, main, chain, board, targetDir}) {
    //console.log("board="+board);

    let flasher=new PeakernelFlasher({cwd, port, dryRun, args, main, chain, board, targetDir});
    let ev=await flasher.createBuildEvent();

    //console.log("ev.board="+ev.board);

    fs.mkdirSync(flasher.targetPath,{recursive: true});

    await peabind({
        idl: peabindMerge(ev.bindings.map(b=>loadJsonIfFilename(b))),
        target: "quickjs",
        output: path.join(flasher.targetPath,"pk_bindings.cpp"),
        prefix: "pk_bindings_"
    });

    let boot=await flasher.generateBootContent(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"boot_js.c"),boot);

    let peakernelMainSource=flasher.generatePeakernelMain(ev);
    fs.writeFileSync(path.join(flasher.targetPath,"peakernel_main.cpp"),peakernelMainSource);

    await chain.postbuild(ev);

    if (!dryRun) {
        if (await chain.canBootFromFile())
            await chain.deploy({chain, cwd, port, args, main})
    }
}
