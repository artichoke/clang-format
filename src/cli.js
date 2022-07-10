"use strict";

/* eslint-disable no-console */

const path = require("node:path");

const { program } = require("commander");

const { version: clangFormatVersion } = require("./embedded-clang-format");
const formatter = require("./index");
const { walk } = require("./fs");
const { STATUS, ko } = require("./result");

const { version } = require("../package.json");

const run = async (directory, options, _command) => {
  try {
    const dir = directory || path.resolve(".");
    let files = await walk(dir);
    files = files.map((result) => {
      if (result.status === STATUS.ok) {
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
    let results;
    if (options.check) {
      results = await formatter.check(dir).run(files);
    } else {
      results = await formatter.format(dir).run(files);
    }
    let failed = false;
    for (const result of results) {
      if (result.status === STATUS.ok) {
        console.log(`OK: ${result.path}`);
        continue;
      }
      if (result.path) {
        console.warn(`KO: ${result.path}`);
      }
      if (result.err) {
        console.error(result.err);
      }
      failed = true;
    }
    if (failed) {
      process.exit(1);
    }
  } catch (err) {
    return Promise.reject(ko(null, err));
  }
};

const main = async () => {
  try {
    const cliVersion = `artichoke/clang-format version ${version}\n${await clangFormatVersion()}`;
    program
      .version(cliVersion)
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
        `Run in 'check' mode. Exit with a non-zero status code if any
formatting errors are found.`
      )
      .arguments("[directory]")
      .action(run);
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error("Error: Unhandled exception");
    console.error(err);
    process.exit(1);
  }
};

module.exports = main;
