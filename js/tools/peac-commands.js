import {dirnameFromImportMeta, runCommand, packageDirname} from "../utils/node-util.js";
import path from "path";
export {peacFlash} from "./peac-flash.js";
import {createDevice} from "../device/Device.js";
import {SerialDeviceConnection, createSerialDeviceConnection} from "../device/SerialDeviceConnection.js";
import {proxyComposeFb} from "../utils/proxy-compose.js";

export async function peacMonitor({cwd, port}) {
    cwd=packageDirname(cwd);
    let targetPath=path.join(cwd,".target");

    await runCommand("pio",["device","monitor"],{cwd: targetPath});
}

export async function peacInfo({cwd, port}) {
    let device=await createDevice({port});
    let info=await device.getInfo();
    console.log(JSON.stringify(info,null,2));

    await device.close();
}