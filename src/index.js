import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";

import pLimit from "p-limit";

import { format } from "./embedded-clang-format.js";
import { ok, ko, STATUS } from "./result.js";

async function formatSource(source, relative) {
  try {
    const contents = await fs.readFile(source);
    const result = await format(source);
    if (result.status === STATUS.failed) {
      return result;
    }

    if (Buffer.compare(result.content, contents) === 0) {
      return ok(relative);
    }

    // Contents did not match -- write formatted contents to disk.
    await fs.writeFile(source, result.content);

    return ok(relative);
  } catch (err) {
    return ko(relative, err);
  }
}

async function checkSource(source, relative) {
  try {
    const contents = await fs.readFile(source);
    const result = await format(source);
    if (result.status === STATUS.failed) {
      return result;
    }

    if (Buffer.compare(result.content, contents) === 0) {
      return ok(relative);
    }

    // Contents did not match -- check mode, so fail.
    return ko(relative);
  } catch (err) {
    return ko(relative, err);
  }
}

export default {
  check(sourceRoot) {
    return {
      sourceRoot,

      async run(sources) {
        const limit = pLimit(8);

        const promises = sources.map((source) => {
          const relative = path.relative(this.sourceRoot, source);
          return limit(() => checkSource(source, relative));
        });
        return Promise.allSettled(promises);
      },
    };
  },

  format(sourceRoot) {
    return {
      sourceRoot,

      async run(sources) {
        const limit = pLimit(8);

        const promises = sources.map((source) => {
          const relative = path.relative(this.sourceRoot, source);
          return limit(() => formatSource(source, relative));
        });
        return Promise.allSettled(promises);
      },
    };
  },

  async execute(sourceRoot, sources, check) {
    if (check) {
      return this.check(sourceRoot).run(sources);
    }
    return this.format(sourceRoot).run(sources);
  },
};
