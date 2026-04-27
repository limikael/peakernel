export function pioParse(s) {
	let currentSection, currentKey;
	let res={};

	for (let line of s.split("\n")) {
		if (line.trim().startsWith("[")) {
			currentSection=line.trim().replace("[","").replace("]","");
			currentKey=null;
			res[currentSection]={};
		}

		else if ([" ","\t"].includes(line[0]) && line.trim()) {
			if (!currentKey || !Array.isArray(res[currentSection][currentKey]))
				throw new Error("Not array");

			res[currentSection][currentKey].push(line.trim());
		}

		else if (line.trim()) {
			if (!currentSection)
				throw new Error("Not in a section: "+line);

			if (!line.includes("="))
				throw new Error("Expectd =");

			let [key,value]=[
				line.slice(0,line.indexOf("=")).trim(),
				line.slice(line.indexOf("=")+1).trim(),
			];

			if (value) {
				res[currentSection][key]=value;
			}

			else {
				currentKey=key;
				res[currentSection][currentKey]=[];
			}
		}
	}

	return res;
}

export function pioStringify(p) {
	
}