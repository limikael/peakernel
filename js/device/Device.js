import {stringChunkify} from "../utils/js-util.js";
import {createSerialDeviceConnection} from "./SerialDeviceConnection.js";
import {proxyComposeFb} from "../utils/proxy-compose.js";

export default class Device {
	constructor({connection}) {
		this.connection=proxyComposeFb(connection,(p,a)=>connection.call(p,a));
	}

	async close() {
		await this.connection.close();
	}

	async getSettings() {
		if (!await this.connection.fileExists("/settings.json"))
			return {};

		return JSON.parse(await this.readFile("/settings.json","utf8"));
	}

	async setSetting(key, value) {
		let settings=await this.getSettings();
		settings[key]=value;

		await this.writeFile("/settings.json",JSON.stringify(settings));
		await this.connection.loadSettings();
	}

    async readFile(fn, encoding) {
        let fid=await this.connection.fileOpen(fn, "r");
        //console.log("fid: "+fid);
        let content=new Uint8Array();
        let s;

        do {
            s=await this.connection.fileReadBase64(fid,1024);
            //console.log("got: "+s);
            if (s!==null)
	            content=new Uint8Array([...content,...new Uint8Array(Buffer.from(s,"base64"))]);

            //console.log("read total: "+content.length);
        } while (s!==undefined && s!==null && s.length);

        //console.log("done... closing...");

        await this.connection.fileClose(fid);

        if (encoding=="utf8")
        	content=new TextDecoder().decode(content);

        return content;
    }

    async writeFile(fn, content) {
    	if (typeof content=="string")
    		content=new TextEncoder().encode(content);

    	if (!(content instanceof Uint8Array))
    		throw new Error("Need Uint8 data...");

		let chunkSize=1024;
        let fid=await this.connection.fileOpen(fn, "w");

        //console.log("opened: "+fid);

		for (let i=0; i<content.length; i+=chunkSize) {
			//console.log("write chunk to: "+(i+chunkSize)+" / "+content.length);

			const chunk=content.subarray(i,i+chunkSize)
			const b64=Buffer.from(chunk).toString("base64")
            await this.connection.fileWriteBase64(fid,b64);
		}

		//console.log("closing...");
        await this.connection.fileClose(fid);
    }
}

export async function createDevice({port, device}) {
	if (device)
		return device;

	let connection=await createSerialDeviceConnection({path: port});
	device=new Device({connection: connection});

	return proxyComposeFb(device,connection,connection.call);
}