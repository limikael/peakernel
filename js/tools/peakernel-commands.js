import {dirnameFromImportMeta, runCommand, packageDirname, table} from "../utils/node-util.js";
import path from "path";
import {peakernelFlash} from "./peakernel-flash.js";
export {peakernelFlash} from "./peakernel-flash.js";
import {createDevice} from "../device/Device.js";
import {SerialDeviceConnection, createSerialDeviceConnection} from "../device/SerialDeviceConnection.js";
import {proxyComposeFb} from "../utils/proxy-compose.js";
import fs, {promises as fsp} from "fs";
import {DeclaredError} from "../utils/js-util.js";
import {loadHookChannel, HookEvent} from "hook-channel";

let __dirname=dirnameFromImportMeta(import.meta);

export async function peakernelLoadHookChannel({cwd}) {
    return await loadHookChannel({
        cwd,
        keyword: "peakernel-plugin",
        exportPath: "peakernel-project-hooks",
        extraModuleDirs: path.join(__dirname,"../../packages"),
        enableKey: "enablePlugins",
        disableKey: "disablePlugins"
    });    
}

export async function peakernelMonitor({cwd, port}) {
    cwd=packageDirname(cwd);
    let targetPath=path.join(cwd,".target");

    await runCommand("pio",["device","monitor"],{cwd: targetPath});
}

export async function peakernelInit({cwd}) {
    if (!cwd)
        cwd=process.cwd();

    let packageJsonPath=path.join(cwd,"package.json");
    if (fs.existsSync(packageJsonPath))
        throw new DeclaredError("package.json already exists");

    let peakernelPkg=JSON.parse(fs.readFileSync(path.join(__dirname,"../../package.json")));
    let pkg={
        "name": path.basename(cwd),
        "type": "module",
        "scripts": {
            "flash": "peakernel flash"
        },
        "dependencies": {
            "peakernel": `^${peakernelPkg.version}`
        }
    }

    fs.writeFileSync(path.join(cwd,"package.json"),JSON.stringify(pkg,null,2));
}

export async function peakernelCat({cwd, port, args}) {
    let device=await createDevice({port});
    let content=await device.readFile(args[0],"utf8");
    console.log(content);
    await device.close();
}

export async function peakernelDeploy({cwd, port, args, main, flash}) {
    cwd=packageDirname(cwd);

    if (flash)
        await peakernelFlash({cwd,port});

    if (args[0])
        main=args[0];

    else if (main)
        main=path.resolve(cwd,main);

    if (!main)
        throw new DeclaredError("No file to deploy.");

    console.log("Deploy: "+main);

    let device=await createDevice({port});
    let mainContent=await fsp.readFile(main);
    await device.writeFile("/boot.js",mainContent);
    await device.scheduleRestart(true);
    await device.awaitBoot();
    await device.close();
}

export async function peakernelStop({cwd, port}) {
    let device=await createDevice({port});
    await device.scheduleRestart(false);
    await device.close();
}

export async function peakernelStart({cwd, port}) {
    let device=await createDevice({port});
    await device.scheduleRestart(true);
    await device.awaitBoot();
    await device.close();
}

export async function peakernelLsmod({cwd}) {
    cwd=packageDirname(cwd);
    let hookChannel=await peakernelLoadHookChannel({cwd});
    let moduleViews=hookChannel.getModules().map(m=>({
        Name: m.getName(),
        Description: m.getDescription(),
        Enabled: m.isEnabled(),
    }));

    table(moduleViews);
}

export async function peakernelEnable({cwd, args}) {
    cwd=packageDirname(cwd);
    let hookChannel=await peakernelLoadHookChannel({cwd});
    await hookChannel.enablePlugin(args[0]);
}

export async function peakernelDisable({cwd, args}) {
    cwd=packageDirname(cwd);
    let hookChannel=await peakernelLoadHookChannel({cwd});
    await hookChannel.disablePlugin(args[0]);
}