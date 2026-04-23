console.log("blinking LED on pin 8...");
pinMode(8,"output");
setInterval(()=>{
	digitalWrite(8,!digitalRead(8));
},1000);
