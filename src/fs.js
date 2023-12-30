"use strict";

import fs from "node:fs/promises";
import path from "node:path";

import { ok, ko } from "./result.js";

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

export { walk };
