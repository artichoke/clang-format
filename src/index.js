"use strict";

const { Buffer } = require("node:buffer");
const fs = require("node:fs/promises");
const path = require("node:path");

const { format } = require("./embedded-clang-format");
const { ok, ko } = require("./result");

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

module.exports = {
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
