import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	ev.addSource(__dirname);
	ev.addIncludeDir(__dirname);
	ev.addLoopFunction("net_loop");
    ev.addBinding(path.join(__dirname,"bindings.json"));
}