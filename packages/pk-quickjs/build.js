import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "path";
import fs from "node:fs";
import {peabind, peabindMerge, peabindGetLibConf} from "peabind";

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

    ev.addDefine("JS_STRICT_NAN_BOXING");
    ev.addDefine("JS_NO_REGEXP");
    ev.addDefine("JS_NO_MODULE_LOADER");
    ev.addDefine("JS_NO_OS");
    ev.addDefine("CONFIG_VERSION","\\\"embedded\\\"");
    ev.addDefine("EMSCRIPTEN");
    ev.addDefine("JSVAL_TARGET_QUICKJS");

    for (let source of fs.readdirSync(path.join(__dirname,"../../vendor/quickjs"))) {
        if (source.endsWith(".c"))
            ev.addSource(path.join(__dirname,"../../vendor/quickjs",source))
    }

    for (let source of peabindGetLibConf("sources",{target: "quickjs"}))
        ev.addSource(source);

    ev.addIncludeDir(path.join(__dirname,"../../vendor/quickjs"));
}