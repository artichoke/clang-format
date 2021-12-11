"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { STATUS, ok, ko } = require("./result");

const binpath = async () => {
  let executable;
  if (os.platform() === "win32") {
    executable = path.resolve(
      __dirname,
      "..",
      "bin",
      "win32",
      "clang-format.exe"
    );
  } else {
    executable = path.resolve(
      __dirname,
      "..",
      "bin",
      os.platform(),
      os.arch(),
      "clang-format"
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
    let formatted = "";

    const stdio = ["ignore", "pipe", process.stderr];
    const clangFormat = spawn(executable, [source], { stdio: stdio });
    clangFormat.stdout.on("data", (data) => {
      formatted += data.toString();
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

module.exports = format;
