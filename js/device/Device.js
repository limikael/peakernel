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

    async readFile(fn) {
        let fid=await this.connection.fileOpen(fn, "r");
        let content="";
        let s;

        do {
            s=await this.connection.fileRead(fid,64);
            content+=s;
        } while (s.length);

        await this.connection.fileClose(fid);

        return content;
    }

    async writeFile(fn, content) {
    	if (content instanceof Uint8Array) {
    		//console.log("write bin...");

			let chunkSize=8192; //16384; // //4096;
	        let fid=await this.connection.fileOpen(fn, "w");

	        //console.log("opened: "+fid);

			for (let i=0; i<content.length; i+=chunkSize) {
				console.log("write: "+i);

				const chunk=content.subarray(i,i+chunkSize)
				const b64=Buffer.from(chunk).toString("base64")
	            await this.connection.fileWriteBase64(fid,b64);
			}
	        await this.connection.fileClose(fid);
    	}

    	else {
	        let chunks=stringChunkify(content,64);
	        let fid=await this.connection.fileOpen(fn, "w");
	        for (let chunk of chunks)
	            await this.connection.fileWrite(fid,chunk);

	        await this.connection.fileClose(fid);
    	}
    }
}

export async function createDevice({port, device}) {
	if (device)
		return device;

	let connection=await createSerialDeviceConnection({path: port});
	device=new Device({connection: connection});

	return proxyComposeFb(device,connection,connection.call);
}