globalThis.fidMap=new Map();
globalThis.nextFid=1;

function fileOpen(pathname, mode) {
	let fid=nextFid++;
	let fh=Fs.getInstance().open(pathname,mode)
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
	return new Promise((resolve, reject) => {
		let fh = Fs.getInstance().open(pathname, "r");
		if (!fh)
			return reject(new Error("unable to open file"));

		let chunks = [];
		let totalLength = 0;

		fh.on("data", chunk => {
			// store chunk, no copying
			chunks.push(chunk);
			totalLength += chunk.length;
		});

		fh.on("close", () => {
			fh.close();

			// single allocation
			let data = new Uint8Array(totalLength);

			// single pass copy
			let offset = 0;
			for (const chunk of chunks) {
				data.set(chunk, offset);
				offset += chunk.length;
			}

			resolve(data);
		});
	});
}
