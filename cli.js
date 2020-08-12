#!/usr/bin/env node
/* eslint-disable no-console */

const path = require("path");
const { program } = require("commander");
const { STATUS, clangFormatter, walk } = require("./index");
require("array-flat-polyfill");

let formatDir = path.resolve(".");

program
  .version("0.1.0")
  .arguments("[directory]")
  .action((directory) => {
    if (directory !== undefined) {
      formatDir = directory;
    }
  })
  .option("--check", "Run in 'check' mode.");

program.parse(process.argv);

(async function main() {
  const timer = setInterval(() => {}, 100);
  try {
    const files = await walk(formatDir);
    const lintState = await clangFormatter(files, program.check);
    const failures = lintState
      .flat(Infinity)
      .filter((status) => status === STATUS.failed);
    if (failures.length > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Error: Unhandled exception");
    console.error(err);
    process.exit(1);
  } finally {
    timer.unref();
  }
})();
