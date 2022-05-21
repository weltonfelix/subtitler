import { $, path } from 'zx';

// eslint-disable-next-line no-unused-vars
import Logger from './log.mjs';

/**
 * @typedef {Object} ParsedSubtitle
 * @property {string[]} subtitleFilesList List of input flags for ffmpeg
 * @property {string[]} mapFlags List of map flags for ffmpeg
 */

/**
 * Parse subtitle files in an array of input and map flags.
 * @param {string[]} subtitleFiles List of subtitle files
 * @param {string} inputDir Folder where the subtitle files are located
 * @returns {ParsedSubtitle} Parsed subtitle files
 */
function parseSubtitlesData(subtitleFiles, inputDir) {
  const subtitleFilesList = subtitleFiles
    .map((subtitle) => [`-i`, `${path.resolve(inputDir, subtitle)}`])
    .flat();

  const mapFlags = (() => {
    const args = [];
    for (let i = 1; i <= subtitleFiles.length; i++) {
      args.push(`-map`, `${i}:0`);
    }
    return args;
  })();

  return { subtitleFilesList, mapFlags };
}

/**
 * Handles mp4 files
 * @param {string} inputVideoFile Input video location
 * @param {string} inputDir Folder where the files are located
 * @param {string} outFile Output file location
 * @param {string[]} subtitleFiles List of subtitle files
 * @param {Logger} logger
 */
export async function handleMp4(
  inputVideoFile,
  inputDir,
  outFile,
  subtitleFiles,
  logger
) {
  const { subtitleFilesList, mapFlags } = parseSubtitlesData(
    subtitleFiles,
    inputDir
  );
  const output = await $`
    ffmpeg -y \
    -i ${inputVideoFile} \
    ${subtitleFilesList} \
    -map 0:v -map 0:a ${mapFlags} \
    -c:v copy -c:a copy \
    -c:s mov_text \
    ${outFile}
  `;

  logger?.log(output);
}

/**
 * Handles mkv files
 * @param {string} inputVideoFile Input video location
 * @param {string} inputDir Folder where the files are located
 * @param {string} outFile Output file location
 * @param {string[]} subtitleFiles List of subtitle files
 * @param {Logger} logger
 */
export async function handleMkv(
  inputVideoFile,
  inputDir,
  outFile,
  subtitleFiles,
  logger
) {
  const { subtitleFilesList, mapFlags } = parseSubtitlesData(
    subtitleFiles,
    inputDir
  );
  const output = await $`
    ffmpeg -y \
    -i ${inputVideoFile} \
    -sub_charenc 'UTF-8' \
    -f srt \
    ${subtitleFilesList} \
    -map 0  ${mapFlags} \
    -c:v copy -c:a copy \
    -c:s srt \
    ${outFile}
  `;

  logger?.log(output);
}
