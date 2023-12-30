"use strict";

import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STATUS, ok, ko } from "./result.js";
import { dirname } from "path";

const binpath = async () => {
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

  try {
    const err = await fs.access(executable, fs.F_OK);
    if (err) {
      return Promise.reject(ko(executable, err));
    }
    return Promise.resolve(ok(executable));
  } catch (err) {
    return Promise.reject(ko(executable, err));
  }
};

const format = async (source) => {
  try {
    const result = await binpath();
    if (result.status === STATUS.failed) {
      return Promise.reject(result);
    }
    const executable = result.path;

    let formatted = Buffer.alloc(0);

    const stdio = ["ignore", "pipe", process.stderr];
    const clangFormat = spawn(executable, [source], { stdio: stdio });
    clangFormat.stdout.on("data", (data) => {
      formatted = Buffer.concat([formatted, data]);
    });

    return new Promise((resolve, reject) => {
      let wasError = false;

      clangFormat.on("error", (err) => {
        reject(ko(source, err));
        // `close` event is triggered after `error`. Track that we have already
        // rejected the promise so we can short circuit in the `close` handler.
        wasError = true;
      });

      clangFormat.on("close", (exitCode) => {
        // The promise was already rejected in the `error` handler, so do
        // nothing.
        if (wasError) {
          return;
        }
        if (exitCode) {
          reject(ko(source, `clang-format exited with error code ${exitCode}`));
        } else {
          resolve(formatted);
        }
      });
    });
  } catch (err) {
    return Promise.reject(ko(null, err));
  }
};

const version = async () => {
  try {
    const result = await binpath();
    if (result.status === STATUS.failed) {
      return Promise.reject(result);
    }
    const executable = result.path;
    let version = "";

    const stdio = ["ignore", "pipe", process.stderr];
    const clangFormat = spawn(executable, ["--version"], { stdio: stdio });
    clangFormat.stdout.on("data", (data) => {
      version += data.toString();
    });

    return new Promise((resolve, reject) => {
      let wasError = false;

      clangFormat.on("error", (err) => {
        reject(ko(null, err));
        // `close` event is triggered after `error`. Track that we have already
        // rejected the promise so we can short circuit in the `close` handler.
        wasError = true;
      });

      clangFormat.on("close", (exitCode) => {
        // The promise was already rejected in the `error` handler, so do
        // nothing.
        if (wasError) {
          return;
        }
        if (exitCode) {
          reject(ko(null, `clang-format exited with error code ${exitCode}`));
        } else {
          resolve(version.trim());
        }
      });
    });
  } catch (err) {
    return Promise.reject(ko(null, err));
  }
};

export { format, version };
