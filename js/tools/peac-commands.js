import {dirnameFromImportMeta, runCommand, packageDirname, table} from "../utils/node-util.js";
import path from "path";
import {peacFlash} from "./peac-flash.js";
export {peacFlash} from "./peac-flash.js";
import {createDevice} from "../device/Device.js";
import {SerialDeviceConnection, createSerialDeviceConnection} from "../device/SerialDeviceConnection.js";
import {proxyComposeFb} from "../utils/proxy-compose.js";
import fs, {promises as fsp} from "fs";
import {DeclaredError} from "../utils/js-util.js";
import {loadHookChannel, HookEvent} from "hook-channel";

let __dirname=dirnameFromImportMeta(import.meta);

export async function peacLoadHookChannel({cwd}) {
    return await loadHookChannel({
        cwd,
        keyword: "peac-plugin",
        exportPath: "peac-build-hooks",
        extraModuleDirs: path.join(__dirname,"../../packages"),
        enableKey: "enablePlugins",
        disableKey: "disablePlugins"
    });    
}

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

export async function peacInit({cwd}) {
    if (!cwd)
        cwd=process.cwd();

    let packageJsonPath=path.join(cwd,"package.json");
    if (fs.existsSync(packageJsonPath))
        throw new DeclaredError("package.json already exists");

    let peacPkg=JSON.parse(fs.readFileSync(path.join(__dirname,"../../package.json")));
    let pkg={
        "name": path.basename(cwd),
        "type": "module",
        "scripts": {
            "flash": "peac flash"
        },
        "dependencies": {
            "peac": `^${peacPkg.version}`
        }
    }

    fs.writeFileSync(path.join(cwd,"package.json"),JSON.stringify(pkg,null,2));
}

export async function peacCat({cwd, port, args}) {
    let device=await createDevice({port});
    let content=await device.readFile(args[0],"utf8");
    console.log(content);
    await device.close();
}

export async function peacDeploy({cwd, port, args, main, flash}) {
    cwd=packageDirname(cwd);

    if (flash)
        await peacFlash({cwd,port});

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

export async function peacStop({cwd, port}) {
    let device=await createDevice({port});
    await device.scheduleRestart(false);
    await device.close();
}

export async function peacStart({cwd, port}) {
    let device=await createDevice({port});
    await device.scheduleRestart(true);
    await device.awaitBoot();
    await device.close();
}

export async function peacLsmod({cwd}) {
    cwd=packageDirname(cwd);
    let hookChannel=await peacLoadHookChannel({cwd});
    let moduleViews=hookChannel.getModules().map(m=>({
        Name: m.getName(),
        Description: m.getDescription(),
        Enabled: m.isEnabled(),
    }));

    table(moduleViews);
}

export async function peacEnable({cwd, args}) {
    cwd=packageDirname(cwd);
    let hookChannel=await peacLoadHookChannel({cwd});
    await hookChannel.enablePlugin(args[0]);
}

export async function peacDisable({cwd, args}) {
    cwd=packageDirname(cwd);
    let hookChannel=await peacLoadHookChannel({cwd});
    await hookChannel.disablePlugin(args[0]);
}