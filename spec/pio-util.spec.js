import {pioParse, pioStringify} from "../js/utils/pio-util.js";

describe("pio-util",()=>{
	it("can parse platformio.ini",()=>{
		let p=pioParse(`
[section1]
hello=1
world=2

[section2]
test=x
test2=
  a
  b
`);

		expect(p.section2.test2).toEqual(["a","b"]);

		let s=pioStringify(p);
		console.log(s);
	});
});