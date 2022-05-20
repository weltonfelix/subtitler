import { path, chalk } from 'zx';
import { echo } from 'zx/experimental';

import { handleMkv, handleMp4 } from './formatHandlers.mjs';

export default function processVideo({
  file,
  extension,
  subtitles,
  inputDir,
  outDir,
}) {
  const inputVideo = path.resolve(inputDir, file);
  const outFile = path.resolve(outDir, file);

  echo(chalk.blue(`Processing '${file}'...`));
  switch (extension) {
    case 'mp4':
      handleMp4(inputVideo, inputDir, outFile, subtitles).then(() => {
        echo(chalk.green(`${file} processed.`));
      });
      break;
    case 'mkv':
      handleMkv(inputVideo, inputDir, outFile, subtitles).then(() => {
        echo(chalk.green(`${file} processed.`));
      });
      break;
    default:
      throw new Error(`Unknown extension: ${extension} for file: ${file}`);
  }
}
