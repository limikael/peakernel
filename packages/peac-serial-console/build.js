import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	//ev.addBinding(path.join(__dirname,"bindings.json"));
	ev.addSourceDir(path.join(__dirname,"."));
	ev.addIncludeDir(path.join(__dirname,"."));
	ev.addSetupFunction("serial_console_setup");
	/*ev.addLoopFunction("runtime_loop");
	ev.addStartFunction("runtime_start");
	ev.addStopFunction("runtime_stop");
	ev.addBootFile(path.join(__dirname,"boot.js"));*/
}