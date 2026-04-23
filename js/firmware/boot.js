globalThis.fidMap=new Map();
globalThis.nextFid=1;

function fileOpen(pathname, mode) {
	let fid=nextFid++;
	let fh=getFsInstance().open(pathname,mode)
	if (!fh)
		throw new Error("Unable to open file");

	fh.setDataEventSize(0);
	fidMap.set(fid,fh);
	return fid;
}

function fileReadBase64(fid, size) {
	let fh=fidMap.get(fid);
	if (!fh)
		throw new Error("File not open");

	//console.log("fileRead, closed="+fh.isClosed());

	if (fh.isClosed())
		return null;

	fh.setDataEventSize(size);
	//console.log("r..");
	return new Promise((resolve,reject)=>{
		let handleData,handleClose;

		handleClose=(data)=>{
			fh.off("data",handleData);
			fh.off("close",handleClose);
			resolve(null);
		}

		handleData=(data)=>{
			//console.log("got d..");
			fh.off("data",handleData);
			fh.off("close",handleClose);
			fh.setDataEventSize(0);
			resolve(encodeBase64(data));
		}

		fh.on("data",handleData);
		fh.on("close",handleClose);
	});
}

function fileWriteBase64(fid, base64data) {
	let fh=fidMap.get(fid);
	if (!fh)
		throw new Error("File not open");

	if (fh.isClosed())
		throw new Error("File closed.");

	//console.log("wr, az="+fh.getDataWriteAdviceSize());
	let data=decodeBase64(base64data);
	fh.write(data);
}

function fileClose(fid) {
	let fh=fidMap.get(fid);
	if (!fh)
		throw new Error("File not open");

	fh.close();
	fidMap.delete(fid);
}

function readFile(pathname) {
	return new Promise((resolve, reject)=>{
		let fh=getFsInstance().open(pathname,"r");
		if (!fh)
			reject(new Error("unable to open file"));

		let data=new Uint8Array();
		fh.on("data",chunk=>{
			console.log("read chunk: "+chunk.length);
			let newData=new Uint8Array(data.length+chunk.length);
			newData.set(data,0);
			newData.set(chunk,data.length);
			data=newData;
		});

		fh.on("close",()=>{
			console.log("closing...");
			fh.close();
			resolve(data);
		});
	});
}

function getInfo() {
	let o={};
	let info=collectInfo();
	let keys=info.getKeys();
	for (let i=0; i<keys.size(); i++) {
		let key=keys.at(i);
		switch (info.getType(key)) {
			case "int":
				o[key]=info.getInt(key);
				break;

			case "string":
				o[key]=info.getString(key);
				break;
		}
	}

	return o;
}

globalThis.bootPromise=new Promise((res,rej)=>{
	globalThis.bootPromiseResolve=res;
	globalThis.bootPromiseReject=rej;
});

function waitFor(bootWaitFor) {
	globalThis.bootWaitFor=bootWaitFor;
}

async function boot() {
	let bootContent=decodeAscii(await readFile("/boot.js"));
	console.log("running boot");
	console.log(bootContent);
	eval(bootContent);
	console.log("ran boot");

	console.log(globalThis.bootWaitFor);

	if (typeof globalThis.bootWaitFor=="function") {
		globalThis.bootWaitFor=globalThis.bootWaitFor();
	}

	await globalThis.bootWaitFor;

	globalThis.bootPromiseResolve();
}

async function awaitBoot() {
	console.log("waiting for boot...");
	return await bootPromise;
}