function getInfo() {
	let o={};
	let info=InfoCollector.getInstance().collectInfo();
	let keys=info.getKeys();
	for (let i=0; i<keys.size(); i++) {
		let key=keys.at(i);
		switch (info.getType(key)) {
			case "int":
				o[key]=info.getInt(key);
				break;

			case "string":
				o[key]=info.getString(key);
				break;
		}
	}

	return o;
}
