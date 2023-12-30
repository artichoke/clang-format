import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";

import { format } from "./embedded-clang-format.js";
import { ok, ko } from "./result.js";

const formatSource = async (source, relative) => {
  try {
    const contents = await fs.readFile(source);
    const formatted = await format(source);
    if (Buffer.compare(formatted, contents) === 0) {
      return Promise.resolve(ok(relative));
    }
    // Contents did not match
    // write formatted contents to disk
    await fs.writeFile(source, formatted);
    return Promise.resolve(ok(relative));
  } catch (err) {
    if (err.err) {
      return Promise.reject(ko(relative, err.err));
    }
    return Promise.reject(ko(relative, err));
  }
};

const checkSource = async (source, relative) => {
  try {
    const contents = await fs.readFile(source);
    const formatted = await format(source);
    if (Buffer.compare(formatted, contents) === 0) {
      return Promise.resolve(ok(relative));
    }
    // Contents did not match
    // check mode, so fail.
    return Promise.resolve(ko(relative));
  } catch (err) {
    if (err.err) {
      return Promise.reject(ko(relative, err.err));
    }
    return Promise.reject(ko(relative, err));
  }
};

export default {
  check(sourceRoot) {
    return {
      sourceRoot,

      async run(sources) {
        const promises = sources.map((source) => {
          const relative = path.relative(this.sourceRoot, source);
          return checkSource(source, relative);
        });
        return Promise.all(promises);
      },
    };
  },

  format(sourceRoot) {
    return {
      sourceRoot,

      async run(sources) {
        const promises = sources.map((source) => {
          const relative = path.relative(this.sourceRoot, source);
          return formatSource(source, relative);
        });
        return Promise.all(promises);
      },
    };
  },
};
