import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	ev.addSource(path.join(__dirname,"espidf-main.cpp"));
	ev.addPlatformioIniItem("platform","espressif32");
	ev.addPlatformioIniItem("framework","espidf");
    ev.addBuildUnflag("-Werror=all");
    ev.addBuildFlag("-Wno-error=incompatible-pointer-types");
    ev.addBuildFlag("-fpermissive");
    ev.setBuildBackend("cmake");
}
