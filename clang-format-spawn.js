const process_spawn = require("child_process").spawn;
const fs = require("fs").promises;
const os = require("os");
const path = require("path");

const { ko } = require("./result");

async function spawn(source, done, stdio) {
  let executable;
  if (os.platform() === "win32") {
    executable = path.resolve(__dirname, "bin", "win32", "clang-format.exe");
  } else {
    executable = path.resolve(
      __dirname,
      "bin",
      os.platform(),
      os.arch(),
      "clang-format"
    );
  }

  try {
    const err = await fs.access(executable, fs.F_OK);
    if (err) {
      return Promise.reject(ko(executable, err));
    }
    const process = process_spawn(executable, [source], { stdio: stdio });
    process.on("close", (exitCode) => {
      if (exitCode) {
        done(`clang-format exited with error code ${exitCode}`);
      } else {
        done(null);
      }
    });
    return Promise.resolve(process);
  } catch (err) {
    return Promise.reject(ko(null, err));
  }
}

module.exports = spawn;
