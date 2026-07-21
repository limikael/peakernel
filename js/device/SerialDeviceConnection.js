import EventEmitter from "node:events";
import {SerialPort} from 'serialport';
import {ReadlineParser} from '@serialport/parser-readline';

export class SerialDeviceConnection extends EventEmitter {
	constructor({path, baudRate}) {
		super();

        if (!baudRate)
            baudRate=112500;

		this.port = new SerialPort({path, baudRate});
		this.openPromise=new Promise((res,err)=>{
			this.port.once("open",res);
			this.port.once("error",err);
		})

		this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
		this.nextId = 1;
		this.pending = new Map();

		this.parser.on('data', (line) => {
			//console.log("line: "+line);

			line=line.trim().replace(/^>+|>+$/g, '').replace("\u001b","").trim();
			//console.log("processing: "+line);

			let msg;
			try {
				msg = JSON.parse(line);
			} catch (e) {
				if (line.trim())
					console.log(line);
				return;
			}

			if (!msg) {
				console.log(line);
				return;
			}

			if (!msg.id) {
				this.emit("message",msg);
			}

			if (msg.id != null && this.pending.has(msg.id) && !msg.method) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				//console.log("****",msg);

				if (msg.error) reject(new Error(msg.error.message || msg.error));
				else resolve(msg.result);
			}
		});
	}

	call=async (method, params)=>{
		//console.log("calling: "+method);

		const id = this.nextId++;
		const msg = { type: 'call', id, method, params };
		let data="\u001b"+JSON.stringify(msg)+"\n";

		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.port.write(data);
		});
	}

	async close() {
		await this.port.close();
	}

	async awaitStarted() {
	    await new Promise(resolve=>{
	        this.on("message",message=>{
	            if (message.type=="started")
	                resolve();
	        });
	    });
	}

	async awaitOpen() {
		return await this.openPromise;
	}
}

export async function createSerialDeviceConnection(options) {
	let connection=new SerialDeviceConnection(options);
	await connection.awaitOpen();

	return connection;
}