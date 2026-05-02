import {dirnameFromImportMeta, runCommand, packageDirname, table} from "../utils/node-util.js";
import path from "path";
import {createDevice} from "../device/Device.js";
import {SerialDeviceConnection, createSerialDeviceConnection} from "../device/SerialDeviceConnection.js";
import {proxyComposeFb} from "../utils/proxy-compose.js";
import fs, {promises as fsp} from "fs";
import {DeclaredError} from "../utils/js-util.js";
import {unindent} from "../utils/lang-util.js";
import {pioStringify} from "../utils/pio-util.js";
import {Command, Option, program} from "commander";
import {chainAttachCommanderCommand, chainList, chainEnable, chainDisable} from "chain-import";
export {flash} from "./peakernel-flash.js";

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
    console.log("Init peakernel project...");

    let cwd=process.cwd();

    let packageJsonPath=path.join(cwd,"package.json");
    if (fs.existsSync(packageJsonPath))
        throw new DeclaredError("package.json already exists (peakernel)");

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

    /*let ini={
        ["env:"+path.basename(cwd)]: {
            "platform": "espressif32",
            "framework": "arduino",
            "board": "esp32-c3-devkitm-1"
        }
    }

    fs.writeFileSync(path.join(cwd,"platformio.ini"),pioStringify(ini));*/

    let dotEnv=unindent(`
        # Port 
        # PEAKERNEL_PORT=/dev/ttyACM0
        # Board
        # PEAKERNEL_BOARD=esp32-c3-devkitm-1
    `);

    fs.writeFileSync(path.join(cwd,".env"),dotEnv);
}

export async function lsmod({chain, cwd, short, all}) {
    let opts={internal: false};
    if (all)
        opts={};

    if (short)
        console.log((await chainList(chain,opts)).map(m=>m.name).join(" "));

    else
        table(await chainList(chain,opts));
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
    chainAttachCommanderCommand(chain,program,"init")
        .description("Create project in current dir.");

    chainAttachCommanderCommand(chain,program,"cat")
        .description("Print remote file.")
        .argument('<file>', 'File to print.');

    chainAttachCommanderCommand(chain,program,"monitor")
        .description("Open monitor.");

    chainAttachCommanderCommand(chain,program,"lsmod")
        .option("--short, -s","Just list names")
        .option("--all, -a","Include internal plugins")
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

    chainAttachCommanderCommand(chain,program,"flash")
        .description("Compile and flash firmware.")
        .argument('[file]', 'Main file.')
        .addOption(new Option("-m, --main <file>","Main file.").env("PEAKERNEL_MAIN"))
        .addOption(new Option("-b, --board <board>","Target board.").env("PEAKERNEL_BOARD"))
        .addOption(new Option("--target-dir <dir>","Temporary project target dir.").env("PEAKERNEL_TARGET_DIR"))
        .option("--dry-run","Just build, don't flash.");
}
