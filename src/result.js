"use strict";

const STATUS = Object.freeze({
  ok: "ok",
  failed: "failed",
});

const ok = (path) =>
  Object.freeze({
    path,
    status: STATUS.ok,
  });

const ko = (path, err = null) =>
  Object.freeze({
    path,
    status: STATUS.failed,
    err,
  });

module.exports = {
  STATUS,
  ok,
  ko,
};
