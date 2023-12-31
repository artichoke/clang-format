import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
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

  let formatted = Buffer.alloc(0);
  try {
    const stdio = ["ignore", "pipe", process.stderr];
    const clangFormat = spawn(executable, [source], { stdio: stdio });

    clangFormat.stdout.on("data", (data) => {
      formatted = Buffer.concat([formatted, data]);
    });

    return new Promise((resolve) => {
      let wasError = false;

      clangFormat.on("error", (err) => {
        resolve(ko(source, err));
        // `close` event is triggered after `error`. Track that we have already
        // resolved the promise so we can short circuit in the `close` handler.
        wasError = true;
      });

      clangFormat.on("close", (exitCode) => {
        // The promise was already resolved with `ko` in the `error` handler, so
        // do nothing.
        if (wasError) {
          return;
        }

        if (exitCode) {
          const result = ko(
            source,
            `clang-format exited with non-zero status code (${exitCode}) for ${source}`,
          );
          resolve(result);
          return;
        }

        resolve(ok(source, { content: formatted }));
      });
    });
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

  let version = Buffer.alloc(0);
  try {
    const stdio = ["ignore", "pipe", process.stderr];
    const clangFormat = spawn(executable, ["--version"], { stdio: stdio });
    clangFormat.stdout.on("data", (data) => {
      version = Buffer.concat([version, data]);
    });

    return new Promise((resolve) => {
      let wasError = false;

      clangFormat.on("error", (err) => {
        resolve(ko(null, err));
        // `close` event is triggered after `error`. Track that we have already
        // resolved the promise so we can short circuit in the `close` handler.
        wasError = true;
      });

      clangFormat.on("close", (exitCode) => {
        // The promise was already resolved with `ko` in the `error` handler, so
        // do nothing.
        if (wasError) {
          return;
        }

        if (exitCode) {
          const result = ko(
            null,
            `clang-format --version exited with non-zero status code (${exitCode})`,
          );
          resolve(result);
          return;
        }

        resolve(ok(null, { version: version.toString().trim() }));
      });
    });
  } catch (err) {
    return ko(null, err);
  }
}
