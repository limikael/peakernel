console.log("i'm here, testing to boot...");
waitFor(async()=>{
	console.log("1...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("2...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("3...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("4...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("5...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("6...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("7...");
	await new Promise(r=>setTimeout(r,1000));
	console.log("8...");
});