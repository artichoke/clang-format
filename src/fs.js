import fs from "node:fs/promises";
import path from "node:path";

import { ok, ko, STATUS } from "./result.js";

async function walk(dir, accumulator) {
  const files = [];

  try {
    const f = await fs.readdir(dir);
    files.push(...f);
  } catch (err) {
    return ko(dir, err);
  }

  const descend = [];
  for (const filename of files) {
    const p = path.join(dir, filename);

    try {
      const stats = await fs.stat(p);

      if (stats.isDirectory()) {
        descend.push(walk(p, accumulator));
        continue;
      }

      if (stats.isFile()) {
        accumulator.push(ok(p));
        continue;
      }

      accumulator.push(ko(p));
    } catch (err) {
      accumulator.push(ko(p, err));
    }
  }
  await Promise.allSettled(descend);
}

export async function getFiles(dir, exts) {
  const files = [];
  const errors = [];

  const acc = [];
  await walk(dir, acc);

  for (const result of acc) {
    if (result.status === STATUS.failed) {
      errors.push(result);
      continue;
    }

    const file = path.relative(dir, result.path);
    const ext = path.extname(file);

    if (exts.has(ext)) {
      files.push(file);
    }
  }

  if (errors.length > 0) {
    return Promise.reject(errors);
  }

  return files;
}
