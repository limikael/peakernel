#!/usr/bin/env node
import {Command, Option, program} from "commander";
import {withMergedOptions} from "../utils/commander-util.js";
import {peakernelFlash, peakernelMonitor, peakernelInit, peakernelCat, peakernelDeploy,
        peakernelStart, peakernelStop, peakernelLsmod, peakernelEnable, peakernelDisable,
        peakernelLoadHookChannel} from "./peakernel-commands.js";
import {loadProjectEnv, getProjectCwd} from "../utils/env-util.js";
import PeakernelCliConfigEvent from "./PeakernelCliConfigEvent.js";

Command.prototype.mergedAction=function(fn) {
    this.action(withMergedOptions(fn));
}

loadProjectEnv();

let cwd=getProjectCwd();
if (cwd) {
    let channel=await peakernelLoadHookChannel({cwd});
    await channel.dispatch(new PeakernelCliConfigEvent(program));
}

program
    .name('peakernel')
    .description('Plugin and JS based MCU platform.')
    .option("--cwd <cwd>","Project dir.")
    .addOption(new Option("-p, --port <port>","How to reach the MCU.").env("PEAC_PORT"))

program
    .command('flash')
    .description("Compile and flash firmware.")
    .option("--dry-run","Just build, don't flash.")
    .action(withMergedOptions(peakernelFlash));

program
    .command('monitor')
    .description("Open monitor.")
    .action(withMergedOptions(peakernelMonitor));

program
    .command("init")
    .description("Create peakernel project in current dir.")
    .action(withMergedOptions(peakernelInit));

program
    .command("cat")
    .description("Print remote file.")
    .argument('<file>', 'File to print.')
    .action(withMergedOptions(peakernelCat));

program
    .command("deploy")
    .description("Deploy program.")
    .argument('[file]', 'Main file.')
    .addOption(new Option("-m, --main <file>","Main file.").env("PEAC_MAIN"))
    .option("--flash","Flash device before deploying.")
    .action(withMergedOptions(peakernelDeploy));

program
    .command("start")
    .description("Start the current program.")
    .action(withMergedOptions(peakernelStart));

program
    .command("stop")
    .description("Stop the current program.")
    .action(withMergedOptions(peakernelStop));

program
    .command("lsmod")
    .description("List plugin modules.")
    .action(withMergedOptions(peakernelLsmod));

program
    .command("enable")
    .description("Enable plugin.")
    .argument('<name>', 'Plugin name.')
    .action(withMergedOptions(peakernelEnable));

program
    .command("disable")
    .description("Disable plugin.")
    .argument('<name>', 'Plugin name.')
    .action(withMergedOptions(peakernelDisable));

try {
    await program.parseAsync(process.argv);
}

catch (e) {
    if (!e.declared)
        throw e;

    console.log(e.message);
    process.exit(1);
}