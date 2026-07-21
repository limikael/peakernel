Sys.getInstance().on("settingsChange",()=>{
	//console.log("settings change...");
	let settings=globalThis.settings;
	//console.log("settings change: "+settings.wifiSsid+"/"+settings.wifiPassword);
	Net.getInstance().setCredentials(settings.wifiSsid,settings.wifiPassword);
	//console.log("changed...");//+settings.wifiSsid+"/"+settings.wifiPassword);
});