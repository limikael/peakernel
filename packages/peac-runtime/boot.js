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

globalThis.fs=getFsInstance();

let devConsole=fs.open("/dev/console","doesn't matter");
console={};
console.log=s=>{
	let bytes=encodeAscii(s+"\n");
    if (devConsole)
    	devConsole.write(bytes);
}
