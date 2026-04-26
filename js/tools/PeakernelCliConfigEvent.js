import {loadHookChannel, HookEvent} from "hook-channel";

export default class PeakernelCliConfigEvent extends HookEvent {
    constructor(program) {
        super("cliConfig");
        this.program=program;
    }
}
