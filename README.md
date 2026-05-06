# Peakernel

Peakernel compiles your JavaScript into a compact bytecode firmware for microcontrollers. You work locally - save a file, and within a second your device runs the updated bundle. Because everything is resolved at build time, there are no dynamic imports or runtime surprises, just a predictable system running exactly what you built. Native C++ plugins extend hardware capabilities like dependencies, giving you a workflow that feels as immediate as CircuitPython, but scales into something far more structured and reliable.

## Why Peakernel?

Peakernel brings a modern developer experience to embedded systems:

* Install hardware capabilities with npm
* Run JavaScript on the device and deploy in <1 second
* Extend everything - firmware, runtime, CLI, and communication - using plugins

## 30-second quick start

Create a new project:

```bash
npm create peakernel
cd my-project
```

Flash the device:

```bash
npm run flash
```

This flashes a minimal firmware and runs `blink.js` (LED blinking).

Edit `blink.js`:

```js
const LEDPIN=8; // Check your board for onboard LED pin, 8 is for ESP32-C3 supermini.
pinMode(LEDPIN,"output");
setInterval(()=>{
  digitalWrite(LEDPIN,!digitalRead(LEDPIN));
},1000);
```

Deploy instantly (no full flash):

```bash
npm run deploy
```

Open a REPL on the device:

```bash
peakernel monitor
```

## The core idea

peakernel separates:

* **firmware** (stable base)
* **runtime** (JavaScript on device)
* **capabilities** (plugins)

This allows fast iteration:

```bash
edit code → deploy (<1s) → test → repeat
```

## Plugins

> Plugins are full-stack modules that extend firmware, runtime, and tooling.

A single plugin can:

* add native firmware (C/C++)
* expose JavaScript APIs on the device
* add CLI commands
* expose RPC endpoints
* integrate into build/deploy
* provide new transports (serial, TCP, cloud, etc.)

### Example: install hardware with npm

```bash
npm install peakernel-can
npm run flash
```

Now your device has CAN support:

```js
await can.send(...)
```

No manual SDK integration. No firmware patching.

### Example: UI on a 20x4 LCD (React-style)

Install:

```bash
npm install peakernel-lcdui
```

Write:

```js
function App() {
  return (
    <Menu>
      <MenuItem label="Item 1" />
      <MenuItem label="Item 2" />
    </Menu>
  );
}

renderController(<App />);
```

This renders a navigable UI on a 20x4 LCD using a rotary encoder.

## Commands

Commands are provided by the core and plugins:

```bash
peakernel --help
```

Plugins can:

* add new commands
* extend existing ones
* integrate into workflows

## RPC & transport

The CLI communicates with the device via JSON-RPC.

Transports are pluggable:

```
serial:/dev/ttyUSB0
tcp://192.168.1.50
peacloud://device-uuid
```

Same commands, different connection.

```bash
peakernel monitor --target=peacloud://device-uuid
```

## JavaScript on the device

peakernel runs JavaScript directly on the device using pluggable engines:

* QuickJS
* mquickjs (experimental)

You can:

```bash
npm run deploy   # fast iteration (<1s)
peakernel monitor # REPL
```

## What makes peakernel different?

* No fixed SDK
* No monolithic firmware
* No separation between tooling and runtime

Instead:

> **Everything is a plugin.**

## Microcontroller Dev Stack Comparison

|                                   | CircuitPython               | Espruino            | Moddable SDK          | peakernel                                |
| --------------------------------- | --------------------------- | ------------------- | --------------------- | ---------------------------------------- |
| **Primary language**              | Python                      | JavaScript          | JavaScript            | JavaScript                               |
| **Execution model**               | Interpreted                 | Interpreted         | Compiled (XS engine)  | Precompiled bytecode (QuickJS)           |
| **Iteration loop**                | Edit on device, auto-reload | REPL + live upload  | Build + deploy        | Save locally → auto bundle + flash (<1s) |
| **Setup complexity**              | Very low                    | Very low            | Medium                | Medium (one-time)                        |
| **Code location**                 | Files on device             | Stored on device    | Built into firmware   | Bundled artifact                         |
| **Bundling**                      | None                        | None                | Partial               | Full (via esbuild)                       |
| **Dependency model**              | Built-in modules            | Manual libs         | Moddable ecosystem    | npm ecosystem                            |
| **Runtime dependency resolution** | Yes                         | Yes                 | Limited               | None (resolved at build)                 |
| **Startup behavior**              | Load + interpret files      | Interpret source    | Load compiled modules | Execute precompiled bytecode             |
| **Memory predictability**         | Lower                       | Lower               | Medium                | Higher (fixed bundle + VM)               |
| **Performance**                   | Interpreter-limited         | Interpreter-limited | Good                  | Good (no parsing, optimized bundle)      |
| **Native extensions**             | Possible, uncommon          | Limited             | Supported             | First-class (C++ plugins via npm)        |
| **Extending hardware**            | Firmware rebuild            | Firmware changes    | Native modules        | `npm install` plugin + flash             |
| **Project structure**             | Script-based                | Script-based        | Structured SDK        | Structured, build-based                  |
| **Scaling projects**              | Can get messy               | Can get messy       | Good                  | Strong + lightweight                     |
| **Tooling ecosystem**             | Simple                      | Minimal             | Custom tooling        | Full JS tooling (bundler, linting, etc.) |
| **Artifact produced**             | Scripts                     | Scripts/tokenized   | Firmware image        | Single bundled program                   |
| **Philosophy**                    | Scripting                   | Scripting           | Platform/SDK          | Build system for firmware                |

## Related

* `peabrain` — a physical industrial controller built on peakernel

## Status

Early stage, evolving quickly.
