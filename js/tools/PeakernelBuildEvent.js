export default class PeakernelBuildEvent {
    constructor() {
        this.bindings=[];
        this.bootContent="";
        this.sources=[];
        this.includeDirs=[];
        this.bootFiles=[];
        this.setupFunctions=[];
        this.loopFunctions=[];
        this.startFunctions=[];
        this.stopFunctions=[];
        this.defines={};
        this.externalBootFile=false;
    }

    setExternalBootFile(v) {
        this.externalBootFile=true;
    }

    addDefine(key, value) {
        this.defines[key]=value;
    }

    addBootFile(bootFile, {priority}={priority: 10}) {
        this.bootFiles.sort((a,b)=>a.priority-b.priority);
        this.bootFiles.push({pathname: bootFile, priority: priority});
    }

    getBootFiles() {
        return this.bootFiles.map(f=>f.pathname);
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
