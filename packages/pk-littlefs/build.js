import { dirnameFromImportMeta } from "../../js/utils/node-util.js";
import {Command, Option, program} from "commander";
import {chainAttachCommanderCommand} from "chain-import";
import {createDevice} from "../../js/device/Device.js";
import path from "path";
import fs, {promises as fsp} from "fs";
import {DeclaredError} from "../../js/utils/js-util.js";

let __dirname = dirnameFromImportMeta(import.meta);

export function build(ev) {
    ev.addSource(path.join(__dirname, "."));
    ev.addIncludeDir(path.join(__dirname, "."));
    ev.addSetupFunction("littlefs_setup");
    ev.setExternalBootFile(true);
}

export async function deploy({cwd, port, args, main}) {
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

flash.priority=20;
export async function flash({cwd, port, args, main}) {
    deploy({cwd, port, args, main});
}

export async function configCli({chain, program}) {
    chainAttachCommanderCommand(chain,program,"deploy")
        .description("Deploy program.")
        .argument('[file]', 'Main file.')
        .addOption(new Option("-m, --main <file>","Main file.").env("PEAKERNEL_MAIN"));
}