import {chainImport} from "chain-import";
import {arrayify} from "../utils/js-util.js";
import {dirnameFromImportMeta} from "../utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export async function peakernelLoad({cwd, extraModuleDirs, extraModules}) {
	extraModules=[
		...arrayify(extraModules), 
		await import("./peakernel-commands.js"),
		await import("./peakernel-flash.js")
	];
	extraModuleDirs=[...arrayify(extraModuleDirs), path.join(__dirname,"../../packages")];

	return await chainImport({
	    cwd,
	    extraModules,
	    extraModuleDirs,
	    keyword: "peakernel-plugin",
	    exportPath: "peakernel-project-hooks",
	    enableKey: "enablePlugins",
	    disableKey: "disablePlugins"
	});  
}