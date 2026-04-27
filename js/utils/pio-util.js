import {arrayify} from "./js-util.js";

export function pioParse(s) {
	let currentSection, currentKey;
	let res={};

	for (let line of s.split("\n")) {
		if (line.trim().startsWith(';')) {
		}

		else if (line.trim().startsWith("[")) {
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

export function pioStringify(sections) {
    function generateItem(name, value) {
        if (Array.isArray(value))
            return `${name}=\n${value.map(v=>`  ${v}`).join("\n")}\n`;

        return `${name}=${value}\n`;
    }

    function generateSection(name, items) {
        let content=`[${name}]\n`;
        for (let itemName in items)
            content+=generateItem(itemName,items[itemName]);

        return content;
    }

    let content="";
    for (let name in sections)
        content+=generateSection(name,sections[name]);

    return content;
}

export function pioGetEnvNames(pio) {
	let names=[];

	for (let k in pio)
		if (k.startsWith("env:"))
			names.push(k.slice(k.indexOf(":")+1));

	return names;
}

export function pioGetEnv(pio, envName) {
	for (let k in pio)
		if (k=="env:"+envName)
			return pio[k];
}

export function pioEnvNormalize(env) {
	env.build_flags=arrayify(env.build_flags);
	env.build_unflags=arrayify(env.build_unflags);
	return env;
}