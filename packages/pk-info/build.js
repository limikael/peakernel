import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import {chainAttachCommanderCommand} from "chain-import";
import {createDevice} from "../../js/device/Device.js";
import path from "path";

let __dirname = dirnameFromImportMeta(import.meta);

export function build(ev) {
    ev.addSource(path.join(__dirname,"InfoRecord.cpp"));
    ev.addIncludeDir(__dirname);
    ev.addDefine("PEAC_INFO");
    ev.addDefine("PEAKERNEL_INFO");
    ev.addBinding(path.join(__dirname,"bindings.json"));
    ev.addBootFile(path.join(__dirname,"boot.js"));
}

export async function peakernelInfo({cwd, port}) {
    let device=await createDevice({port});
    let info=await device.getInfo();
    console.log(JSON.stringify(info,null,2));

    await device.close();
}

export async function configCli({chain, program}) {
    chainAttachCommanderCommand(chain,program,"info")
        .description("Show runtime info.");
}

export async function info({port}) {
    let device=await createDevice({port});
    let info=await device.getInfo();
    await device.close();

    console.log(JSON.stringify(info,null,2));
}
