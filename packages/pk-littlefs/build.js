import { dirnameFromImportMeta } from "../../js/utils/node-util.js";
import path from "path";

let __dirname = dirnameFromImportMeta(import.meta);

export function build(ev) {
    ev.addSource(path.join(__dirname, "."));
    ev.addIncludeDir(path.join(__dirname, "."));
    ev.addSetupFunction("littlefs_setup");

    //ev.addLoopFunction("littlefs_loop");
}