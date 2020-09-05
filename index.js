const fs = require("fs").promises;
const path = require("path");

require("array-flat-polyfill");

const clangFormatSpawn = require("./clang-format-spawn");
const { ok, ko } = require("./result");

const IGNORE_DIRECTORIES = Object.freeze([
  ".git",
  "node_modules",
  "target",
  "vendor",
]);

async function walk(dir) {
  try {
    const files = await fs.readdir(dir);
    const children = files
      .filter((file) => !IGNORE_DIRECTORIES.includes(file))
      .map(async (file) => {
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
    return Promise.all(children).then((dirEntries) =>
      dirEntries.flat(Infinity).filter((entry) => entry != null)
    );
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
  return new Promise(async (resolve, reject) => {
    let formatted = "";
    const done = async (err) => {
      if (err) {
        return reject(ko(relative, err));
      }
      try {
        const contents = await fs.readFile(source);
        if (formatted.toString() === contents.toString()) {
          resolve(ok(relative));
        } else if (checkMode) {
          resolve(ko(relative));
        } else {
          await fs.writeFile(source, formatted.toString());
          resolve(ok(relative));
        }
      } catch (error) {
        reject(ko(relative, error));
      }
    };
    try {
      const formatter = await clangFormatSpawn(source, done, [
        "ignore",
        "pipe",
        process.stderr,
      ]);
      formatter.stdout.on("data", (data) => {
        formatted += data.toString();
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  clangFormatter,
  walk,
};
