#!/usr/bin/env zx
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
    const inputVideo = path.resolve(folder, file);
    const outFile = path.resolve(outDir, file);
    switch (extension) {
      case "mp4":
        handleMp4(inputVideo, outFile, subtitles);
        break;
      case "mkv":
        //TODO: add MKV support
        break;
    }
  }
});

async function handleMp4(inputVideo, outFile, subtitles) {
  const subtitlesList = subtitles
    .map((subtitle) => [`-i`, `${path.resolve(folder, subtitle)}`])
    .flat();

  const maps = (function () {
    const args = [];
    for (let i = 1; i <= subtitles.length; i++) {
      args.push(`-map`, `${i}`);
    }
    return args;
  })();

  await $`
    ffmpeg -y \
    -i ${inputVideo} \
    ${subtitlesList} \
    -map 0:v -map 0:a ${maps} \
    -c:v copy -c:a copy \
    -c:s mov_text \
    ${outFile}
  `;
}
