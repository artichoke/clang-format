#!/usr/bin/env node
/* eslint-disable no-console */

const path = require("path");
const { program } = require("commander");
const { STATUS, clangFormatter, walk } = require("./index");
require("array-flat-polyfill");

async function run(directory, cmd) {
  const dir = directory || path.resolve(".");
  let files = await walk(dir);
  files = files.map((result) => {
    if (result.status == STATUS.ok) {
      return result.path;
    }
    if (result.path) {
      console.warn(`KO: ${result.path}`);
    }
    if (result.err) {
      console.error(result.err);
    }
    return null;
  });
  if (files.includes(null)) {
    process.exit(1);
  }
  const lintState = await clangFormatter(files, cmd.check, dir);
  let failed = false;
  lintState.forEach((result) => {
    if (result.status == STATUS.ok) {
      console.log(`OK: ${result.path}`);
      return;
    }
    if (result.path) {
      console.warn(`KO: ${result.path}`);
    }
    if (result.err) {
      console.error(result.err);
    }
    failed = true;
  });
  if (failed) {
    process.exit(1);
  }
}

(async function main() {
  const timer = setInterval(() => {}, 100);
  try {
    program
      .version("0.1.0")
      .description(
        `Node.js runner for LLVM clang-format

clang-format is a tool to format C code.

If no arguments are given, the runner formats the current directory recursively.
Any clang-format configuration present on the filesystem will be honored.

--check mode is suitable for CI. --check does not attempt to format and instead
exits with a non-zero status code if the source code on disk does not match the
enforced style.`
      )
      .option(
        "--check",
        "Run in 'check' mode. Exit with a non-zero status if errors."
      )
      .arguments("[directory]")
      .action(run);
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error("Error: Unhandled exception");
    console.error(err);
    process.exit(1);
  } finally {
    timer.unref();
  }
})();
