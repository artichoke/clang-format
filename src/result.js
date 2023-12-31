import chalk from "chalk";

export const STATUS = Object.freeze(
  Object.assign(Object.create(null), {
    ok: "ok",
    failed: "failed",
  }),
);

export function ok(path, extra = null) {
  return Object.freeze(
    Object.assign(
      Object.create(null),
      {
        path,
        status: STATUS.ok,
      },
      extra || {},
    ),
  );
}

export function ko(path, err = null) {
  return Object.freeze(
    Object.assign(Object.create(null), {
      path,
      status: STATUS.failed,
      err,
    }),
  );
}

export function reportError(result) {
  if (result.status !== STATUS.failed) {
    throw new Error("attempted to report error for success");
  }
  if (result.err) {
    console.log(chalk.red.bold("KO") + `: ${result.path} (ERR: ${result.err})`);
    return;
  }
  console.log(chalk.red.bold("KO") + `: ${result.path}`);
}

export function reportOk(result) {
  if (result.status !== STATUS.ok) {
    throw new Error("attempted to report success for failure");
  }
  console.log(chalk.green.bold("OK") + `: ${result.path}`);
}
