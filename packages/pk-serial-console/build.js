import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	//ev.addBinding(path.join(__dirname,"bindings.json"));
	ev.addSource(path.join(__dirname,"serial-console.cpp"));
	ev.addIncludeDir(path.join(__dirname,"."));
	ev.addSetupFunction("serial_console_setup");
	ev.addLoopFunction("serial_console_loop");
	ev.addStartFunction("serial_console_start");
	ev.addStopFunction("serial_console_stop");
	//ev.addBootFile(path.join(__dirname,"boot.js"));
}