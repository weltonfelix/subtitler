import { $, path } from 'zx';

// eslint-disable-next-line no-unused-vars
import Logger from './log.mjs';

/**
 * @typedef {Object} SubtitleLang
 * @property {string} name Language name
 * @property {string} code ISO 639-3 language code
 */

/**
 * @typedef {Object} Subtitle
 * @property {string} file Subtitle file
 * @property {SubtitleLang} language Subtitle language
 */

/**
 * @typedef {Object} ParsedSubtitle
 * @property {string[]} subtitleFilesList List of input flags for ffmpeg
 * @property {string[]} mapFlags List of map flags for ffmpeg
 * @property {string[]} metadata List of metadata flags for ffmpeg
 */

/**
 * Parse subtitle files in an array of input and map flags.
 * @param {Subtitle[]} subtitlesList List of subtitle files
 * @param {string} inputDir Folder where the subtitle files are located
 * @param {number} previousSubtitlesCount Number of previous subtitles
 * @returns {ParsedSubtitle} Parsed subtitle files
 */
function parseSubtitlesData(subtitlesList, inputDir, previousSubtitlesCount) {
  const subtitleFilesList = subtitlesList
    .map(({ file: subtitleFile }) => [
      `-i`,
      `${path.resolve(inputDir, subtitleFile)}`,
    ])
    .flat();

  const mapFlags = (() => {
    const args = [];
    for (let i = 1; i <= subtitlesList.length; i++) {
      args.push(`-map`, `${i}:0`);
    }
    return args;
  })();

  const metadata = (() => {
    const args = [];
    for (let i = 0; i < subtitlesList.length; i++) {
      const subtitleLang = subtitlesList[i].language;
      if (!subtitleLang) continue;
      args.push(
        `-metadata:s:s:${previousSubtitlesCount + i}`,
        `title=${subtitleLang.name}`,
        `-metadata:s:s:${previousSubtitlesCount + i}`,
        `language=${subtitleLang.code}`
      );
    }
    return args;
  })();

  return { subtitleFilesList, mapFlags, metadata };
}

/**
 * Handles mp4 files
 * @param {string} inputVideoFile Input video location
 * @param {string} videoTitle Video title
 * @param {string} inputDir Folder where the files are located
 * @param {string} outFile Output file location
 * @param {string[]} subtitleFiles List of subtitle files
 * @param {Logger} logger
 */
export async function handleMp4(
  inputVideoFile,
  videoTitle,
  inputDir,
  outFile,
  subtitleFiles,
  logger
) {
  const countSubtitlesOutput = await $`
    ffprobe \
    -v error \
    -select_streams s \
    -show_entries stream=index \
    -of csv=p=0 \
    ${inputVideoFile} \
    | wc -w
  `;

  logger?.log(countSubtitlesOutput);
  const previousSubtitlesCount = Number(
    countSubtitlesOutput['stdout'].replace(/[\r\n]/gm, '')
  );

  const { subtitleFilesList, mapFlags, metadata } = parseSubtitlesData(
    subtitleFiles,
    inputDir,
    previousSubtitlesCount
  );

  const output = await $`
    ffmpeg -y \
    -i ${inputVideoFile} \
    ${subtitleFilesList} \
    -map 0:v -map 0:a ${mapFlags} \
    -map_metadata:g -1 \
    -c:v copy -c:a copy \
    -c:s mov_text \
    -metadata title=${videoTitle} \
    ${metadata} \
    ${outFile}
  `;

  logger?.log(output);
}

/**
 * Handles mkv files
 * @param {string} inputVideoFile Input video location
 * @param {string} videoTitle Video title
 * @param {string} inputDir Folder where the files are located
 * @param {string} outFile Output file location
 * @param {string[]} subtitleFiles List of subtitle files
 * @param {Logger} logger
 */
export async function handleMkv(
  inputVideoFile,
  videoTitle,
  inputDir,
  outFile,
  subtitleFiles,
  logger
) {
  const countSubtitlesOutput = await $`
    ffprobe \
    -v error \
    -select_streams s \
    -show_entries stream=index \
    -of csv=p=0 \
    ${inputVideoFile} \
    | wc -w
  `;

  logger?.log(countSubtitlesOutput);
  const previousSubtitlesCount = Number(
    countSubtitlesOutput['stdout'].replace(/[\r\n]/gm, '')
  );

  const { subtitleFilesList, mapFlags, metadata } = parseSubtitlesData(
    subtitleFiles,
    inputDir,
    previousSubtitlesCount
  );

  const output = await $`
    ffmpeg -y \
    -i ${inputVideoFile} \
    -sub_charenc 'UTF-8' \
    -f srt \
    ${subtitleFilesList} \
    -map_metadata:g -1 \
    -map 0  ${mapFlags} \
    -c:v copy -c:a copy \
    -metadata title=${videoTitle} \
    ${metadata} \
    ${outFile}
  `;

  logger?.log(output);
}
