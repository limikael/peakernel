import {fileURLToPath} from 'url';
import {spawn} from "child_process";
import {packageUpSync} from "package-up";
import {DeclaredError} from "./js-util.js";
import path from "path";
import {Console} from "node:console";
import {Transform} from "node:stream";
import fs from "node:fs";

export function dirnameFromImportMeta(meta) {
    return fileURLToPath(new URL('.', meta.url));
}

export function runCommand(cmd, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
            stdio: "inherit",
            //stdio: ["ignore", "pipe", "pipe"],
            ...options,
        });

        let stdout = "";
        let stderr = "";

        if (child.stdout) {
            child.stdout.on("data", d => stdout += d);
        }

        if (child.stderr) {
            child.stderr.on("data", d => stderr += d);
        }

        child.on("error", reject);

        child.on("close", code => {
            if (code === 0) {
                resolve({ code, stdout, stderr });
            } else {
                const err = new Error(`Command failed: ${cmd} ${args.join(" ")}`);
                err.code = code;
                err.stdout = stdout;
                err.stderr = stderr;
                reject(err);
            }
        });
    });
}

export function packageDirname(cwd) {
    let packageFilename=packageUpSync({cwd});
    if (!packageFilename)
        throw new DeclaredError("Not inside a project.");

    return path.dirname(packageFilename);
}

export function updateFile(fileName, content) {
    let currentContent;
    if (fs.existsSync(fileName))
        currentContent=fs.readFileSync(fileName,"utf8");

    if (content!=currentContent)
        fs.writeFileSync(fileName,content);
}

export function table(input) {
  // @see https://stackoverflow.com/a/67859384
  const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
  const logger = new Console({ stdout: ts })
  logger.table(input)
  const table = (ts.read() || '').toString()
  let result = '';
  for (let row of table.split(/[\r\n]+/)) {
    let r = row.replace(/[^┬]*┬/, '┌');
    r = r.replace(/^├─*┼/, '├');
    r = r.replace(/│[^│]*/, '');
    r = r.replace(/^└─*┴/, '└');
    r = r.replace(/'/g, ' ');
    result += `${r}\n`;
  }
  result=result.split("\n").filter(r=>r.trim().length).join("\n");
  console.log(result);
}