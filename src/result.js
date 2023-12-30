"use strict";

const STATUS = Object.freeze(
  Object.assign(Object.create(null), {
    ok: "ok",
    failed: "failed",
  }),
);

const ok = (path) =>
  Object.freeze(
    Object.assign(Object.create(null), {
      path,
      status: STATUS.ok,
    }),
  );

const ko = (path, err = null) =>
  Object.freeze(
    Object.assign(Object.create(null), {
      path,
      status: STATUS.failed,
      err,
    }),
  );

module.exports = {
  STATUS,
  ok,
  ko,
};
