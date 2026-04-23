import {peacFlash, peacInfo, peacDeploy} from "../../js/tools/peac-commands.js";
import {createDevice} from "../../js/device/Device.js";
import {dirnameFromImportMeta, runCommand, packageDirname} from "../../js/utils/node-util.js";
import path from "path";

jasmine.DEFAULT_TIMEOUT_INTERVAL=60000*5;

let __dirname=dirnameFromImportMeta(import.meta);

describe("peac",()=>{
	let port="/dev/ttyESP-58:8C:81:AA:02:94";

	it("can flash",async()=>{
		await peacFlash({port});
	});

	it("can communicate with the mcu",async ()=>{
		await peacFlash({port});
		//let info=await peacInfo({port});
		//console.log(info);
		let start,duration;

	    let device=await createDevice({port});
	    let data="";
	    while (data.length<100000)
	    	data+=crypto.randomUUID();

	    start=Date.now();
	    await device.writeFile("/test.txt",data);
	    duration=(Date.now()-start)/1000;

	    console.log("written, rate="+100000/duration);

	    start=Date.now();
	    let content=await device.readFile("/test.txt","utf8");
	    duration=(Date.now()-start)/1000;
	    console.log("read, rate="+100000/duration);
	    //console.log(content);
	    expect(content).toEqual(data);
	    await device.close();
	});

	it("can deploy",async ()=>{
		await peacDeploy({
			port, 
			//flash: true,
			main: path.join(__dirname,"testboot.js")
		});
	});
});