import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import {createDevice} from "../../js/device/Device.js";
import path from "path";

let __dirname = dirnameFromImportMeta(import.meta);

export function build(ev) {
    ev.addSource(__dirname, ".");
    ev.addIncludeDir(__dirname);
    ev.addDefine("PEAC_INFO");
    ev.addBinding(path.join(__dirname,"bindings.json"));
    ev.addBootFile(path.join(__dirname,"boot.js"));
}

export async function peacInfo({cwd, port}) {
    let device=await createDevice({port});
    let info=await device.getInfo();
    console.log(JSON.stringify(info,null,2));

    await device.close();
}

export function cliConfig(ev) {
    ev.program
        .command('info')
        .description("Show runtime info.")
        .mergedAction(peacInfo)
}
