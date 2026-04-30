import {dirnameFromImportMeta, runCommand, packageDirname, table} from "../utils/node-util.js";
import path from "path";
import {createDevice} from "../device/Device.js";
import {SerialDeviceConnection, createSerialDeviceConnection} from "../device/SerialDeviceConnection.js";
import {proxyComposeFb} from "../utils/proxy-compose.js";
import fs, {promises as fsp} from "fs";
import {DeclaredError} from "../utils/js-util.js";
import {pioStringify} from "../utils/pio-util.js";
import {Command, Option, program} from "commander";
import {chainAttachCommanderCommand, chainList, chainEnable, chainDisable} from "chain-import";

let __dirname=dirnameFromImportMeta(import.meta);

export async function cat({cwd, port, args}) {
    let device=await createDevice({port});
    let content=await device.readFile(args[0],"utf8");
    console.log(content);
    await device.close();
}

export async function monitor({cwd, port}) {
    cwd=packageDirname(cwd);
    let targetPath=path.join(cwd,".target");

    await runCommand("pio",["device","monitor"],{cwd: targetPath});
}

export async function init() {
    let cwd=process.cwd();

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

    let ini={
        ["env:"+path.basename(cwd)]: {
            "platform": "espressif32",
            "framework": "arduino",
            "board": "esp32-c3-devkitm-1"
        }
    }

    fs.writeFileSync(path.join(cwd,"platformio.ini"),pioStringify(ini));
}

export async function lsmod({chain, cwd, short}) {
    if (short)
        console.log((await chainList(chain)).map(m=>m.name).join(" "));

    else
        table(await chainList(chain));
}

export async function stop({port}) {
    let device=await createDevice({port});
    await device.scheduleRestart(false);
    await device.close();
}

export async function start({port}) {
    let device=await createDevice({port});
    await device.scheduleRestart(true);
    await device.awaitBoot();
    await device.close();
}

export async function enable({chain, args}) {
    for (let a of args)
        await chainEnable(chain,a);
}

export async function disable({chain, args}) {
    for (let a of args)
        await chainDisable(chain,a);
}

export async function configCli({chain, program}) {
    chainAttachCommanderCommand(chain,program,"cat")
        .description("Print remote file.")
        .argument('<file>', 'File to print.');

    chainAttachCommanderCommand(chain,program,"monitor")
        .description("Open monitor.");

    chainAttachCommanderCommand(chain,program,"init")
        .description("Create peakernel project in current dir.");

    chainAttachCommanderCommand(chain,program,"lsmod")
        .option("--short, -s","Just list names")
        .description("List plugin modules.");

    chainAttachCommanderCommand(chain,program,"enable")
        .description("Enable plugin.")
        .argument('<name...>', 'Plugin name.');

    chainAttachCommanderCommand(chain,program,"disable")
        .description("Disable plugin.")
        .argument('<name...>', 'Plugin name.');

    chainAttachCommanderCommand(chain,program,"start")
        .description("Start the current program.");

    chainAttachCommanderCommand(chain,program,"stop")
        .description("Stop the current program.");
}
