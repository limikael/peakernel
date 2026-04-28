function setInterval(fn, ms) {
	let t=createInterval(ms);
	t.on("timer",fn);
	return t.getId();
}

function setTimeout(fn, ms) {
	let t=createTimeout(ms);
	t.on("timer",fn);
	return t.getId();
}

function clearTimeout(id) {
	clearTimer(id);
}

function clearInterval(id) {
	clearTimer(id);
}

if (globalThis.Fs) {
	globalThis.fs=Fs.getInstance();

	let devConsole=fs.open("/dev/console","doesn't matter");
	if (devConsole) {
		globalThis.console={};
		globalThis.console.log=s=>{
			let bytes=encodeAscii(s+"\n");
		    if (devConsole)
		    	devConsole.write(bytes);
		}
	}
}

if (!globalThis.console) {
	globalThis.console={};
	globalThis.console.log=serialWriteString;
}

globalThis.bootPromise=new Promise((res,rej)=>{
	globalThis.bootPromiseResolve=res;
	globalThis.bootPromiseReject=rej;
});

function waitFor(bootWaitFor) {
	globalThis.bootWaitFor=bootWaitFor;
}

async function boot() {
	if (globalThis.bootFunction)
		globalThis.bootFunction();

	else {
		let bootContent=decodeAscii(await readFile("/boot.js"));
		eval(bootContent);
	}

	if (typeof globalThis.bootWaitFor=="function") {
		globalThis.bootWaitFor=globalThis.bootWaitFor();
	}

	await globalThis.bootWaitFor;
	globalThis.bootPromiseResolve();
}

async function awaitBoot() {
	await bootPromise;
}
