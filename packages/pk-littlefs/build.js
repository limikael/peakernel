import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import {Command, Option, program} from "commander";
import {chainAttachCommanderCommand} from "chain-import";
import {DeclaredError} from "../../js/utils/js-util.js";
import path from "node:path";

let __dirname = dirnameFromImportMeta(import.meta);

export function build(ev) {
    ev.addSource(path.join(__dirname,"pk-littlefs.cpp"));
    ev.addIncludeDir(__dirname);
    ev.addSetupFunction("littlefs_setup");
    ev.setExternalBootFile(true);
}

export function canBootFromFile() {
    return true;
}