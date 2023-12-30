"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const { ok, ko } = require("./result");

const walk = async (dir) => {
  try {
    const files = await fs.readdir(dir);
    const children = files.map(async (file) => {
      try {
        const filepath = path.join(dir, file);
        const stats = await fs.stat(filepath);
        if (stats.isDirectory()) {
          return walk(filepath);
        }
        if (stats.isFile()) {
          return Promise.resolve(ok(filepath));
        }
        return Promise.reject(ko(filepath));
      } catch (err) {
        return Promise.reject(ko(file, err));
      }
    });
    const listing = Promise.all(children);
    return listing.then((entries) => entries.flat(Infinity));
  } catch (err) {
    return Promise.reject(ko(null, err));
  }
};

module.exports = {
  walk,
};
