class Repl {
    constructor(serial, model) {
        this.serial=serial;
        this.line='';
        this.serial.on('data', (chunk) => {
            //console.log("got chunk...");
            for (let c of chunk)
                this.handleInput(String.fromCharCode(c));
        });

        this.writeString("> ");
        this.escapeMode=false;
        this.model=model;
    }

    writeString(s) {
        this.serial.write(encodeAscii(s));
    }

    writeMessage(o) {
        this.writeString("\n\n\u001b"+JSON.stringify(o)+"\n\n");
    }

    async runMessageLine(line) {
        //console.log("** running message line..");

        let messageId;
        try {
            let message=JSON.parse(line);
            messageId=message.id;
            let res=this.model[message.method](...message.params);
            if (res && typeof res=="object" && res.then)
                res=await res;

            this.writeMessage({
                id: message.id,
                result: res
            });
        }

        catch (e) {
            //this.writeString("\n"); //\n\n");
            this.writeMessage({
                id: messageId,
                error: {
                    message: String(e),
                }
            });
        }
    }

    handleInput(char) {
        if (this.escapeMode) {
            this.line+=char;
            if (char=="\n") {
                this.runMessageLine(this.line);
                this.escapeMode=false;
                this.line="";
            }
            return;
        }

        switch (String(char)) {
            case "\u001b":
                this.escapeMode=true;
                this.line="";
                break;

            case "\u0008":
            case "\u007f":
                if (this.line.length > 0) {
                    this.line = this.line.slice(0, -1);
                    // move cursor back, clear char
                    this.writeString('\b \b');
                }
                break;

            case "\n":
                this.writeString('\n');
                if (this.line.trim().length) {
                    try {
                        let res=globalThis.eval(this.line);
                        this.writeString(String(res)+"\n");
                    }

                    catch (e) {
                        this.writeString(e.name+": "+e.message+"\n");
                    }
                }

                this.writeString('> ');
                this.line = '';
                break;

            default:
                this.line+=char;
                this.writeString(char);
                break;
        }
    }
}

function installRepl(serial) {
    globalThis.__repl=new Repl(serial,globalThis);
}

/*if (globalThis.devConsole)
    installRepl(globalThis.devConsole);*/

if (globalThis.Fs)
    installRepl(Fs.getInstance().open("/dev/console","rw"));
