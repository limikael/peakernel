//import {hello} from "./extimport.js";

pinMode(8,"output");

//throw new Error("ballaalba");

setInterval(()=>{
	//console.log("blinking LED on pin 8.. ");
	digitalWrite(8,!digitalRead(8));
},250);
