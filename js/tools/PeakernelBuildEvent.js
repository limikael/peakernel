import fs from "node:fs";

export default class PeakernelBuildEvent {
    constructor() {
        this.bindings=[];
        this.sources=[];
        this.includeDirs=[];
        this.bootFiles=[];
        this.setupFunctions=[];
        this.loopFunctions=[];
        this.startFunctions=[];
        this.stopFunctions=[];
        this.defines={};
        this.externalBootFile=false;
        this.libDeps=[];
        this.board="";
        this.env=process.env;
    }

    setBoard(b) {
        this.board=b;
    }

    addLibDep(libDep) {
        this.libDeps.push(libDep);
    }

    setExternalBootFile(v) {
        this.externalBootFile=true;
    }

    addDefine(key, value) {
        this.defines[key]=value;
    }

    addBootFile(bootFile, {priority}={priority: 10}) {
        this.bootFiles.push({pathname: bootFile, priority: priority});
        this.bootFiles.sort((a,b)=>a.priority-b.priority);
    }

    addBootContent(bootContent, {priority}={priority: 10}) {
        this.bootFiles.push({content: bootContent, priority: priority});
        this.bootFiles.sort((a,b)=>a.priority-b.priority);
    }

    async getBootContent() {
        this.bootFiles.sort((a,b)=>a.priority-b.priority);
        return (this.bootFiles.map(e=>{
            if (e.pathname)
                e.content=fs.readFileSync(e.pathname,"utf8");

            return e.content;
        }).join("\n"));
    }

    addBinding(binding) {
        this.bindings.push(binding);
    }

    addSource(source) {
        this.sources.push(source);
    }

    addIncludeDir(includeDir) {
        this.includeDirs.push(includeDir);
    }

    addSetupFunction(f) {
        this.setupFunctions.push(f);
    }

    addLoopFunction(f) {
        this.loopFunctions.push(f);
    }

    addStartFunction(f, {priority}={priority: 10}) {
        this.startFunctions.push({name: f, priority: priority});
    }

    getStartFunctions() {
        this.startFunctions.sort((a,b)=>a.priority-b.priority);
        return this.startFunctions.map(f=>f.name);
    }

    addStopFunction(f, {priority}={priority: 10}) {
        this.stopFunctions.push({name: f, priority: priority});
    }

    getStopFunctions() {
        this.stopFunctions.sort((a,b)=>b.priority-a.priority);
        return this.stopFunctions.map(f=>f.name);
    }
}
