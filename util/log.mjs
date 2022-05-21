import { fs } from 'zx';

export default class Logger {
  logFile;

  /**
   * @param {string} fileName Name of log file
   */
  constructor(fileName) {
    this.logFile = fs.createWriteStream(fileName, { flags: 'w' });
  }

  /**
   * @param  {...any} args
   */
  log(...args) {
    this.logFile.write(
      `${new Date().toLocaleString()}  -  ${String(...args)}\n`
    );
  }
}
