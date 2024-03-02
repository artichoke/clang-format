import { Buffer } from "node:buffer";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STATUS, ok, ko } from "./result.js";

async function isExecutable(file) {
  try {
    await fs.access(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function binpath() {
  const dir = path.dirname(fileURLToPath(import.meta.url));

  let executable;
  if (os.platform() === "win32") {
    executable = path.resolve(dir, "..", "bin", "win32", "clang-format.exe");
  } else {
    executable = path.resolve(
      dir,
      "..",
      "bin",
      os.platform(),
      os.arch(),
      "clang-format",
    );
  }

  if (await isExecutable(executable)) {
    return ok(executable);
  }
  return ko(executable);
}

export async function format(source) {
  const result = await binpath();
  if (result.status === STATUS.failed) {
    return result;
  }
  const executable = result.path;

  try {
    const { output } = await spawn(executable, [source]);
    return ok(null, { content: output });
  } catch (err) {
    return ko(source, err);
  }
}

export async function clangFormatVersion() {
  const result = await binpath();
  if (result.status === STATUS.failed) {
    return result;
  }
  const executable = result.path;

  try {
    const { output } = await spawn(executable, ["--version"]);
    return ok(null, { version: output.toString().trim() });
  } catch (err) {
    return ko(null, err);
  }
}

function spawn(executable, args) {
  let output = Buffer.alloc(0);

  const stdio = ["ignore", "pipe", process.stderr];
  const proc = child_process.spawn(executable, args, { stdio: stdio });

  proc.stdout.on("data", (data) => {
    output = Buffer.concat([output, data]);
  });

  return new Promise((resolve, reject) => {
    const handleClose = (exitCode) => {
      if (exitCode !== 0) {
        const argv = [path.basename(executable), ...args];
        reject(
          `${argv.join(" ")} exited with non-zero status code (${exitCode})`,
        );
        return;
      }

      resolve({ output });
    };

    proc.on("error", (err) => {
      reject(err);

      // `close` event is triggered after `error`. Remove the `close` event
      // handler to avoid double-rejecting the promise.
      //
      // From the docs <https://nodejs.org/api/child_process.html#event-close>:
      //
      // > The 'close' event will always emit after 'exit' was already emitted,
      // > or 'error' if the child failed to spawn.
      proc.off("close", handleClose);
    });

    proc.on("close", handleClose);
  });
}
