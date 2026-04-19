class JsonRpcDeviceConnection {
	constructor({host, port}) {
		if (!port)
			port=80;

		this.url=`http://${host}:${port}/`;
	}

	async call(method, params=[]) {
		let response=await fetch(this.url,{
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				method: method,
				params: params
			})
		});

		let resultObj=await response.json();
		return resultObj.result;
	}

	async close() {}
	async awaitStarted() {
		console.log("Start/stop...");

		//await timeout(1000,async ()=>{
			await new Promise(r=>setTimeout(r,250));
			await this.call("getInfo");
		//});
	}
}
