"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const { ok, ko } = require("./result");

const IGNORE_DIRECTORIES = Object.freeze([
  ".git",
  "build",
  "emsdk",
  "node_modules",
  "target",
  "vendor",
]);

const walk = async (dir) => {
  try {
    const files = await fs.readdir(dir);
    const permissible = files.filter(
      (file) => !IGNORE_DIRECTORIES.includes(file)
    );
    const children = permissible.map(async (file) => {
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

const filesWithExtension = (files, ext) =>
  files.filter((file) => {
    const extname = path.extname(file);
    return ext === extname;
  });

const formattableSourcesFrom = (files) => [
  ...filesWithExtension(files, ".c"),
  ...filesWithExtension(files, ".cc"),
  ...filesWithExtension(files, ".cpp"),
  ...filesWithExtension(files, ".h"),
  ...filesWithExtension(files, ".hpp"),
  ...filesWithExtension(files, ".m"),
  ...filesWithExtension(files, ".mm"),
];

module.exports = Object.freeze(
  Object.assign(Object.create(null), {
    formattableSourcesFrom,
    walk,
  })
);
