import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

build.priority=5;
export function build(ev) {
	ev.addBinding(path.join(__dirname,"bindings.json"));
	ev.addSource(path.join(__dirname));
	ev.addIncludeDir(path.join(__dirname));
	ev.addSetupFunction("runtime_setup");
	ev.addLoopFunction("runtime_loop");
	ev.addStartFunction("runtime_start");
	ev.addStopFunction("runtime_stop");
	ev.addBootFile(path.join(__dirname,"boot.js"));
}