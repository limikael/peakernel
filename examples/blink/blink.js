pinMode(8,"output");

setInterval(()=>{
	console.log("blinking LED on pin 8...");
	digitalWrite(8,!digitalRead(8));
},1000);
