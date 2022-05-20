#!/usr/bin/env zx
import { $, argv, chalk, fs, path } from 'zx';

import processVideo from './util/processVideo';

$.verbose = false;

if (argv.h || argv.help) {
  console.log(`
    ${chalk.bold(chalk.bgMagentaBright(' Subtitler '))}
    ${chalk.bold('  Usage:')}
        zx subtitler.mjs [options] <inputDir>
    ${chalk.bold('  Options:')}
        <inputDir>    The directory containing the video files to process
        -h | --help   Show help message
  `);
  process.exit(0);
}

const inputDir = argv._[1] || argv._[0];

if (!inputDir) {
  console.log(chalk.blue('Usage: subtitler <folder>'));
  process.exit(1);
}
if (!fs.existsSync(inputDir)) {
  console.error(chalk.red(`Folder '${inputDir}' does not exist.`));
  process.exit(2);
}

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

type File = {
  file: string;
  subtitles?: string[];
};

type VideoFiles = {
  [extension: string]: File[];
};

const videoFiles: VideoFiles = {
  mp4: [],
  mkv: [],
};

const subtitleFiles: string[] = [];

rawInputFiles.forEach((file) => {
  const fileExtension = path.extname(file).slice(1);

  if (videoFiles[fileExtension]) {
    videoFiles[fileExtension].push({
      file,
    });
  } else if (fileExtension === 'srt') {
    subtitleFiles.push(file);
  } else {
    console.warn('Unknown file extension:', file);
  }
});

Object.entries(videoFiles).forEach(([extension, files]) => {
  for (let i = 0; i < files.length; i++) {
    const videoFileName = files[i].file;

    const subtitles = subtitleFiles.filter((file) =>
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

    processVideo({ file, extension, subtitles, inputDir, outDir });
  });
});
