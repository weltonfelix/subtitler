import { chalk, path } from 'zx';
import { handleMkv, handleMp4 } from './formatHandlers';

interface IProcessVideo {
  file: string;
  extension: string;
  subtitles: string[];
  inputDir: string;
  outDir: string;
}

export default function processVideo({
  file,
  extension,
  subtitles,
  inputDir,
  outDir,
}: IProcessVideo) {
  const inputVideo = path.resolve(inputDir, file);
  const outFile = path.resolve(outDir, file);

  console.log(chalk.blue(`Processing '${file}'...`));
  switch (extension) {
    case 'mp4':
      handleMp4(inputVideo, inputDir, outFile, subtitles).then(() => {
        console.log(chalk.green(`${file} processed.`));
      });
      break;
    case 'mkv':
      handleMkv(inputVideo, inputDir, outFile, subtitles).then(() => {
        console.log(chalk.green(`${file} processed.`));
      });
      break;
    default:
      throw new Error(`Unknown extension: ${extension} for file: ${file}`);
  }
}
