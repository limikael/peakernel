#!/usr/bin/env node
import {Command, Option, program} from "commander";
import {loadProjectEnv, getProjectCwd} from "../utils/env-util.js";
import {peakernelLoad} from "./peakernel-load.js";
import path from "path";

loadProjectEnv();
let cwd=getProjectCwd();
let chain=await peakernelLoad({cwd});

program
    .name('peakernel')
    .description('Plugin and JS based MCU platform.')
    .option("--cwd <cwd>","Project dir.",cwd)
    .addOption(new Option("-p, --port <port>","How to reach the MCU.").env("PEAKERNEL_PORT"))

await chain.configCli({chain, program});

try {
    await program.parseAsync(process.argv);
}

catch (e) {
    if (!e.declared)
        throw e;

    console.log(e.message);
    process.exit(1);
}