#!/usr/bin/env zx
import { handleMkv, handleMp4 } from "./util/formatHandlers.mjs";
$.verbose = false;
const folder = argv._[1];

if (!folder) {
  console.log(chalk.blue("Usage: subtitler <folder>"));
  process.exit(1);
}

const outDir = path.resolve(folder, "out");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const subPaths = fs.readdirSync(folder, { withFileTypes: true });
const files = subPaths
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name);

const videoFiles = {
  mp4: [],
  mkv: [],
};

const subtitleFiles = [];

files.forEach((file) => {
  const fileExtension = path.extname(file).slice(1);

  if (videoFiles[fileExtension]) {
    videoFiles[fileExtension].push({
      file,
    });
  } else if (fileExtension === "srt") {
    subtitleFiles.push(file);
  } else {
    console.warn("Unknown file extension:", file);
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
  for (const { file, subtitles } of files) {
    if (subtitles.length === 0) {
      console.warn(
        chalk.yellow(`No subtitles found for '${file}'. Skipping...`)
      );
      continue;
    }

    processVideo(file, extension, subtitles);
  }
});

function processVideo(file, extension, subtitles) {
  const inputVideo = path.resolve(folder, file);
  const outFile = path.resolve(outDir, file);

  console.log(chalk.blue(`Processing '${file}'...`));
  switch (extension) {
    case "mp4":
      handleMp4(inputVideo, folder, outFile, subtitles).then(() => {
        console.log(chalk.green(`${file} processed.`));
      });
      break;
    case "mkv":
      handleMkv(inputVideo, folder, outFile, subtitles).then(() => {
        console.log(chalk.green(`${file} processed.`));
      });
      break;
    default:
      throw new Error(`Unknown extension: ${extension} for file: ${file}`);
  }
}
