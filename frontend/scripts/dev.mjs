import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const viteBin = require.resolve("vite/bin/vite.js");

const incomingArgs = process.argv.slice(2);

const normalizedArgs = incomingArgs.map((arg) => {
  if (arg === "--hostname") return "--host";
  if (arg.startsWith("--hostname=")) return arg.replace("--hostname=", "--host=");
  return arg;
});

const child = spawn(process.execPath, [viteBin, ...normalizedArgs], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
