import {chainImport, chainSetContract} from "chain-import";
import {arrayify} from "../utils/js-util.js";
import {dirnameFromImportMeta} from "../utils/node-util.js";
import path from "path";

let __dirname=dirnameFromImportMeta(import.meta);

export async function peakernelLoad({cwd, roots, internal}) {
	//console.log("load");

	let chain=await chainImport({
	    cwd,
	    roots: [path.join(__dirname,"../.."), ...arrayify(roots)],
	    keyword: "peakernel-plugin",
	    exportPath: "peakernel-project-hooks",
	    enableKey: "enablePlugins",
	    disableKey: "disablePlugins",
	    defaultEnableKey: "defaultEnable",
	    workspaceKey: "packages",
	    internalKey: "internal",
	    internal: ["peakernel",...arrayify(internal)]
	});

	//console.log("******* load");

	//chainSetContract(chain,"monitor","first-defined","async");
	chainSetContract(chain,"init","first-defined");
	chainSetContract(chain,"canBootFromFile","first-defined");
	chainSetContract(chain,"bundleConf");
	chainSetContract(chain,"postbuild","procedural");

	return chain;
}