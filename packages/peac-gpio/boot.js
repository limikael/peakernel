function pinOnChange(p,f) {
	pin(p).on("change",f);
}

function pinOffChange(p,f) {
	pin(p).off("change",f);
}

/*pinMode(4,"input_pullup");
pinMode(8,"output");
pinOnChange(4,v=>{
	if (!v)
		digitalWrite(8,!digitalRead(8));
});*/
//pinOnChange(4,v=>console.log("change: "+v));
