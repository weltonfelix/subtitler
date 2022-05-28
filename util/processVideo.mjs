import { path, chalk } from 'zx';
import { echo, startSpinner } from 'zx/experimental';

import { handleMkv, handleMp4 } from './formatHandlers.mjs';

export default function processVideo({
  file,
  extension,
  subtitles,
  inputDir,
  outDir,
  logger,
}) {
  const inputVideo = path.resolve(inputDir, file);
  const fileName = path.parse(file).name;
  const outFile = path.resolve(outDir, file);

  echo(chalk.blue(`Processing '${file}'...`));
  const stopSpinner = startSpinner(`Processing videos...`);
  switch (extension) {
    case 'mp4':
      handleMp4(inputVideo, fileName, inputDir, outFile, subtitles, logger).then(() => {
        echo(chalk.green(`${file} processed.`));
        stopSpinner();
      });
      break;
    case 'mkv':
      handleMkv(inputVideo, fileName, inputDir, outFile, subtitles, logger).then(() => {
        echo(chalk.green(`${file} processed.`));
        stopSpinner();
      });
      break;
    default:
      throw new Error(`Unknown extension: ${extension} for file: ${file}`);
  }
}
