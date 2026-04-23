#!/usr/bin/env node
import {Command, Option, program} from "commander";
import {withMergedOptions} from "../utils/commander-util.js";
import {peacFlash, peacMonitor, peacInfo, peacInit, peacCat, peacDeploy} from "./peac-commands.js";
import {loadProjectEnv} from "../utils/env-util.js";

loadProjectEnv();

program
    .name('peac')
    .description('Plugin and JS based MCU platform.')
    .option("--cwd <cwd>","Project dir.")
    .addOption(new Option("-p, --port <port>","How to reach the MCU.").env("PEAC_PORT"))

program
    .command('flash')
    .description("Compile and flash firmware.")
    .action(withMergedOptions(peacFlash));

program
    .command('monitor')
    .description("Open monitor.")
    .action(withMergedOptions(peacMonitor));

program
    .command('info')
    .description("Show runtime info.")
    .action(withMergedOptions(peacInfo));

program
    .command("init")
    .description("Create peac project in current dir.")
    .action(withMergedOptions(peacInit));

program
    .command("cat")
    .description("Print remote file.")
    .argument('<file>', 'File to print.')
    .action(withMergedOptions(peacCat));

program
    .command("deploy")
    .description("Deploy program.")
    .argument('[file]', 'Main file.')
    .addOption(new Option("-m, --main <file>","Main file.").env("PEAC_MAIN"))
    .action(withMergedOptions(peacDeploy));

try {
    await program.parseAsync(process.argv);
}

catch (e) {
    if (!e.declared)
        throw e;

    console.log(e.message);
    process.exit(1);
}