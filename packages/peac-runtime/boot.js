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
    function encodeAscii(str) {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }

	let bytes=encodeAscii(s+"\n");
    if (devConsole)
    	devConsole.write(bytes);
}

/*setInterval(()=>{
	digitalToggle(8);
	console.log("hello world");
},1000);*/
