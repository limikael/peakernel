pinMode(8,"output");

//waitFor(async ()=>{
	console.log("blinking LED on pin 8...");

	setInterval(()=>{
		digitalWrite(8,!digitalRead(8));
	},1000);
//});
