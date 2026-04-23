console.log("press the button on pin 4 to toggle LED on pin 8");

pinMode(4,"input_pullup");
pinMode(8,"output");
pinOnChange(4,v=>{
	if (!v)
		digitalWrite(8,!digitalRead(8));
});
