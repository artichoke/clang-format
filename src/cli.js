/* eslint-disable no-console */

import fs from "node:fs/promises";
import path from "node:path";

import { program } from "commander";
import ignore from "ignore";

import { clangFormatVersion } from "./embedded-clang-format.js";
import formatter from "./index.js";
import { getFiles } from "./fs.js";
import { STATUS, reportError, reportOk } from "./result.js";

const VERSION = "0.16.0";

async function getIgnore(options) {
  if (!options.ignore) {
    return ignore();
  }

  try {
    const content = await fs.readFile(options.ignorePath, "utf8");
    const rules = content.split(/\r?\n/);
    return ignore().add(rules);
  } catch {
    return ignore();
  }
}

async function runCli(directory, options) {
  const dir = path.resolve(directory || ".");
  const exts = new Set(options.ext.split(","));
  const files = [];

  try {
    files.push(...(await getFiles(dir, exts)));
  } catch (err) {
    console.debug(err);
    for (const result of err) {
      reportError(result);
    }
    return 1;
  }

  const ig = await getIgnore(options);
  const sources = files
    .filter(ig.createFilter())
    .map((file) => path.join(dir, file))
    .map((file) => path.resolve(file));

  const results = await formatter.execute(dir, sources, options.check);

  let exitCode = 0;
  for (let result of results) {
    if (result.status === "rejected") {
      reportError(ko(null, result.reason));
      exitCode = 1;
      continue;
    }

    result = result.value;
    if (result.status === STATUS.failed) {
      reportError(result);
      exitCode = 1;
      continue;
    }

    reportOk(result);
  }

  return exitCode;
}

export default async function main() {
  const clangFormatVer = await clangFormatVersion();
  if (clangFormatVer.status === STATUS.failed) {
    reportError(clangFormatVer);
    process.exit(1);
  }
  const cliVersion = `artichoke/clang-format version ${VERSION}\n${clangFormatVer.version}`;

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
    .option("--no-ignore", "disable use of ignore files and patterns")
    .arguments("[directory]");

  program.parse();
  const options = program.opts();
  const dir = program.args[0];

  try {
    const exitCode = await runCli(dir, options);
    process.exit(exitCode);
  } catch (err) {
    console.error("Error: Unhandled exception");
    console.error(err);
    process.exit(1);
  }
}
