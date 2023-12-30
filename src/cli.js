/* eslint-disable no-console */

import fs from "node:fs/promises";
import path from "node:path";

import chalk from "chalk";
import { program } from "commander";
import ignore from "ignore";

import { version as clangFormatVersion } from "./embedded-clang-format.js";
import formatter from "./index.js";
import { walk } from "./fs.js";
import { STATUS } from "./result.js";

const VERSION = "0.16.0";

const getFiles = async (dir, exts) => {
  const files = [];
  const errors = [];

  for (const candidate of await walk(dir)) {
    if (candidate.status === STATUS.ok) {
      const p = candidate.path;
      const ext = path.extname(p);
      if (exts.has(ext)) {
        files.push(p);
      }
      continue;
    }
    if (candidate.path) {
      errors.push({ type: "warn", path });
    }
    if (candidate.err) {
      errors.push({ type: "error", error: candidate.err });
    }
  }
  if (errors.length > 0) {
    return Promise.reject(errors);
  }
  return files;
};

const getIgnore = async (ignoreFilePath) => {
  try {
    const content = await fs.readFile(ignoreFilePath, "utf8");
    const rules = content.split(/\r?\n/);
    return ignore().add(rules);
  } catch (_err) {
    return ignore();
  }
};

const formatSources = async (dir, sources, check) => {
  if (check) {
    return formatter.check(dir).run(sources);
  } else {
    return formatter.format(dir).run(sources);
  }
};

const run = async (directory, options, _command) => {
  const dir = path.resolve(directory || ".");
  const exts = new Set(options.ext.split(","));
  const files = [];

  try {
    const f = await getFiles(dir, exts);
    files.push(...f);
  } catch (err) {
    for (const result of err) {
      if (result.type === "warn") {
        console.log(chalk.red.bold("KO") + `: ${result.path}`);
      }
      if (result.type === "error") {
        console.error(result.err);
      }
    }
    process.exit(1);
  }

  const ig = await getIgnore(options.ignorePath);
  const sources = files
    .map((file) => path.relative(dir, file))
    .filter(ig.createFilter())
    .map((file) => path.join(dir, file));

  const results = await formatSources(dir, sources, options.check);

  let failed = false;
  for (const result of results) {
    if (result.status === STATUS.ok) {
      console.log(chalk.green.bold("OK") + `: ${result.path}`);
      continue;
    }
    if (result.path) {
      console.log(chalk.red.bold("KO") + `: ${result.path}`);
    }
    if (result.err) {
      console.error(result.err);
    }
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
};

const main = async () => {
  try {
    const cliVersion = `artichoke/clang-format version ${VERSION}\n${await clangFormatVersion()}`;
    program
      .version(cliVersion)
      .description(
        `Node.js runner for LLVM clang-format

clang-format is a tool to format C code.

If no arguments are given, the runner formats the current directory recursively.
Any clang-format configuration present on the filesystem will be honored.

--check mode is suitable for CI. --check does not attempt to format and instead
exits with a non-zero status code if the source code on disk does not match the
enforced style.`,
      )
      .option(
        "-c, --check",
        `check if the given files are formatted. Exit with a non-
zero status code if any formatting errors are found.`,
      )
      .option(
        "--ext <extensions>",
        "specify formattable file extensions",
        ".c,.cc,.cpp,.h",
      )
      .option(
        "--ignore-path <path>",
        "specify path of ignore file",
        ".clang-format-ignore",
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

export default main;
