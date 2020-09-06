const fs = require("fs").promises;
const path = require("path");

const format = require("./format");
const { ok, ko } = require("./result");

const IGNORE_DIRECTORIES = Object.freeze([
  ".git",
  "build",
  "emsdk",
  "node_modules",
  "target",
  "vendor",
]);

async function walk(dir) {
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
}

const filesWithExtension = (files, ext) =>
  files.filter((file) => {
    const extname = path.extname(file);
    return [ext, `.${ext}`].includes(extname);
  });

const cFiles = (files) => [
  ...filesWithExtension(files, "c"),
  ...filesWithExtension(files, "h"),
];

async function clangFormatter(files, checkMode, sourceRoot) {
  const sources = cFiles(files);
  return Promise.all(
    sources.map((source) => {
      const relative = path.relative(sourceRoot, source);
      return formatSource(source, relative, checkMode);
    })
  );
}

async function formatSource(source, relative, checkMode) {
  try {
    const contents = await fs.readFile(source);
    const formatted = await format(source);
    if (formatted.toString() === contents.toString()) {
      return Promise.resolve(ok(relative));
    }
    // Contents did not match
    if (checkMode) {
      // check mode, so fail.
      return Promise.resolve(ko(relative));
    }
    // write formatted contents to disk
    await fs.writeFile(source, formatted.toString());
    return Promise.resolve(ok(relative));
  } catch (err) {
    return Promise.reject(ko(relative, err));
  }
}

module.exports = {
  clangFormatter,
  walk,
};
