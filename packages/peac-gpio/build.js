import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	ev.addBootFile(path.join(__dirname,"boot.js"));
	ev.addBinding(path.join(__dirname,"bindings.json"));
	ev.addSource(path.join(__dirname,"peac-gpio.cpp"));
	ev.addLoopFunction("gpio_loop");
	ev.addIncludeDir(path.join(__dirname));
}