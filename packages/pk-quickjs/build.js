import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export function build(ev) {
	ev.addSource(path.join(__dirname,"QuickjsEngine.cpp"));
	ev.addSource(path.join(__dirname,"SoftTimer.cpp"));
	ev.addIncludeDir(__dirname);
	ev.addSetupFunction("quickjs_setup");
	ev.addStartFunction("quickjs_start",{priority: 1});
	ev.addStartFunction("quickjs_run_script",{priority: 15});
	ev.addLoopFunction("quickjs_loop");
	ev.addStopFunction("quickjs_stop",{priority: 1});
    ev.addBinding(path.join(__dirname,"bindings.json"));
}