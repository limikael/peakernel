function pinOnChange(p,f) {
	pin(p).on("change",f);
}

function pinOffChange(p,f) {
	pin(p).off("change",f);
}

//pinOnChange(4,v=>console.log("change: "+v));
