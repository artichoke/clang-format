"use strict";

const STATUS = Object.freeze(
  Object.create(null, {
    ok: "ok",
    failed: "failed",
  })
);

const ok = (path) =>
  Object.freeze(
    Object.create(null, {
      path,
      status: STATUS.ok,
    })
  );

const ko = (path, err = null) =>
  Object.freeze(
    Object.create(null, {
      path,
      status: STATUS.failed,
      err,
    })
  );

module.exports = Object.freeze(
  Object.create(null, {
    STATUS,
    ok,
    ko,
  })
);
