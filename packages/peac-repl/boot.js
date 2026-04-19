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
        function encodeAscii(str) {
            const arr = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                arr[i] = str.charCodeAt(i);
            }
            return arr;
        }

        this.serial.write(encodeAscii(s));
    }

    handleInput(char) {
        if (this.escapeMode) {
            this.line+=char;
            if (char=="\n") {
                let messageId;
                try {
                    //console.log("line: "+this.line);
                    let message=JSON.parse(this.line);
                    messageId=message.id;
                    let res=this.model[message.method](...message.params);
                    this.writeString("\u001b"+JSON.stringify({
                        id: message.id,
                        result: res
                    })+"\n");
                }

                catch (e) {
                    this.writeString("\u001b"+JSON.stringify({
                        id: messageId,
                        error: {
                            message: String(e),
                            also: "test"
                        }
                    })+"\n");
                }

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

installRepl(fs.open("/dev/console","rw"));
