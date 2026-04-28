pinMode(8,"output");

setInterval(()=>{
	console.log("hello from blink");
	digitalWrite(8,!digitalRead(8));
},1000);

/*pinMode(8,"output");

//console.log("blinking LED on pin 8...");

setInterval(()=>{
	digitalWrite(8,!digitalRead(8));
},1000);*/
