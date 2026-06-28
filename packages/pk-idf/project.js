import {runCommand, dirnameFromImportMeta, updateFile, packageDirname} from "../../js/utils/node-util.js";
import {autoIndent} from "../../js/utils/lang-util.js";
import fs from "node:fs";
import path from "node:path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
}

async function generateIdfProject(ev) {
    let projectCmakeContent=autoIndent(`
        cmake_minimum_required(VERSION 3.16)
        include($ENV{IDF_PATH}/tools/cmake/project.cmake)
        project(peakernel)            
    `);

    updateFile(path.join(ev.targetPath,"CMakeLists.txt"),projectCmakeContent);

    let mainCmakeContent=autoIndent(`
        idf_component_register(
        SRCS
        ${ev.sources.map(s=>`"${s}"`).join("\n")}
        INCLUDE_DIRS
        ${ev.includeDirs.map(s=>`"${s}"`).join("\n")}
        )

        target_compile_definitions(\${COMPONENT_LIB} PRIVATE
            JS_STRICT_NAN_BOXING
            JS_NO_REGEXP
            JS_NO_MODULE_LOADER
            JS_NO_OS
            CONFIG_VERSION="embedded"
            EMSCRIPTEN
            JSVAL_TARGET_QUICKJS
        )

        target_compile_options(\${COMPONENT_LIB} PRIVATE
            -Wno-error
            -Wno-error=incompatible-pointer-types
            -fpermissive
        )
    `);

    fs.mkdirSync(path.join(ev.targetPath,"main"),{recursive: true});
    updateFile(path.join(ev.targetPath,"main","CMakeLists.txt"),mainCmakeContent);

    let sdkconfigContent=autoIndent(`
		CONFIG_IDF_TARGET="${ev.board}"
    `);

    updateFile(path.join(ev.targetPath,"sdkconfig.defaults"),sdkconfigContent);
}

export async function postbuild(ev) {
	console.log("IDF build: "+ev.targetPath);
    ev.addSource(path.join(__dirname,"../../src/main-espidf.cpp"));

	await generateIdfProject(ev);

	await runCommand("idf.py",["--ccache","-p",ev.port,"flash"],{cwd: ev.targetPath});
}

monitor.priority=5;
export async function monitor({cwd, port, targetDir}) {
    cwd=packageDirname(cwd);
    let targetPath;

    if (targetDir)
        targetPath=targetDir;

    else if (cwd)
        targetPath=path.join(cwd,".target");

    else
        targetPath=path.join(os.tmpdir(),"peakernel-tmp",".target");

    await runCommand("idf.py",["-p",port,"monitor"],{cwd: targetPath});
    process.exit();
}
