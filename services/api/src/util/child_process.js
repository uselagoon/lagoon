/* eslint-disable */

// @flow

const { exec, execFile } = require('child_process');

type execP$Result = { stdout: Buffer, stderr: Buffer };
type spawnP$Result = { stdout: string, stderr: string, exitCode: number };

const execP = (
  command: string,
  options?: child_process$execOpts
): Promise<execP$Result> => {
  return new Promise((res, rej) => {
    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        res({ stdout: new Buffer(stdout), stderr: new Buffer(stderr) });
      }
    });
  });
};

const execFileP = (
  command: string,
  argsOrOptions?: Array<string> | child_process$execFileOpts,
  options?: child_process$execFileOpts
): Promise<execP$Result> => {
  let _args: Array<string>;
  let _opts: child_process$execFileOpts;

  if (Array.isArray(argsOrOptions)) {
    _args = argsOrOptions;
    _opts = options ? options : {};
  } else {
    _args = [];
    _opts = argsOrOptions ? argsOrOptions : {};
  }

  return new Promise((res, rej) => {
    execFile(command, _args, _opts, (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        res({ stdout: stdout, stderr: stderr });
      }
    });
  });
};

module.exports = { exec, execP };
