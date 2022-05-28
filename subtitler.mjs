#!/usr/bin/env zx
import path from 'path';
import { $, argv, chalk, fs } from 'zx';
import { echo } from 'zx/experimental';
import Logger from './util/log.mjs';

import processVideo from './util/processVideo.mjs';

import { subtitleLanguages } from './config.mjs';

if (argv['v'] || argv['verbose']) {
  $.verbose = true;
} else {
  $.verbose = false;
}

if (argv['h'] || argv['help']) {
  echo(`
    ${chalk.bold(chalk.bgMagentaBright(' Subtitler '))}
    ${chalk.bold('  Usage:')}
        zx subtitler.mjs [options] <inputDir>
    ${chalk.bold('  Options:')}
        <inputDir>      The directory containing the video files to process
        -h | --help     Show help message
        -v | --verbose  Show verbose output
  `);
  process.exit(0);
}

const inputDir = argv._[1] || argv._[0];
if (!inputDir) {
  echo(chalk.blue('Usage: subtitler <folder>'));
  process.exit(1);
}
if (!fs.existsSync(inputDir)) {
  console.error(chalk.red(`Folder '${inputDir}' does not exist.`));
  process.exit(2);
}

const logger = new Logger('subtitler-log.txt');

const outDir = path.resolve(inputDir, 'out');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const rawInputFiles = fs
  .readdirSync(inputDir, { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name);

if (rawInputFiles.length === 0) {
  console.error(chalk.red('No files found in folder.'));
}

const videoFiles = {
  mp4: [],
  mkv: [],
};

const subtitleFiles = [];

rawInputFiles.forEach((file) => {
  const fileExtension = path.extname(file).slice(1);

  if (videoFiles[fileExtension]) {
    videoFiles[fileExtension].push({
      file,
    });
  } else if (fileExtension === 'srt') {
    const fileNameLang = file.split('.').slice(-2, -1)[0];
    const subtitleLang =
      fileNameLang in subtitleLanguages
        ? subtitleLanguages[fileNameLang]
        : null;

    subtitleFiles.push({
      file,
      language: subtitleLang,
    });
  } else {
    console.warn('Unknown file extension:', file);
  }
});

Object.entries(videoFiles).forEach(([extension, files]) => {
  for (let i = 0; i < files.length; i++) {
    const videoFileName = files[i].file;

    const subtitles = subtitleFiles.filter(({ file }) =>
      file.includes(path.basename(videoFileName, `.${extension}`))
    );

    videoFiles[extension][i].subtitles = subtitles;
  }
});

Object.entries(videoFiles).forEach(([extension, files]) => {
  files.forEach(({ file, subtitles }) => {
    if (!subtitles || subtitles.length === 0) {
      console.warn(
        chalk.yellow(`No subtitles found for '${file}'. Skipping...`)
      );
      return;
    }

    processVideo({ file, extension, subtitles, inputDir, outDir, logger });
  });
});
