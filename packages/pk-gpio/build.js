import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	ev.addBootFile(path.join(__dirname,"boot.js"));
	ev.addBinding(path.join(__dirname,"bindings.json"));
	ev.addSource(__dirname);
	ev.addIncludeDir(__dirname);
	ev.addLoopFunction("gpio_loop");
}