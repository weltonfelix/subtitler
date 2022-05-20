/**
 * @typedef {Object} ParsedSubtitle
 * @property {String[]} subtitlesList List of input flags for ffmpeg
 * @property {String[]} maps List of map flags for ffmpeg
 */

/**
 * Parse subtitle files in an array of input and map flags.
 * @param {String[]} subtitles List of subtitle files
 * @param {String} folder Folder where the subtitle files are located
 * @returns {ParsedSubtitle} Parsed subtitle files
 */
function parseSubtitlesData(subtitles, folder) {
  const subtitlesList = subtitles
    .map((subtitle) => [`-i`, `${path.resolve(folder, subtitle)}`])
    .flat();

  const maps = (function () {
    const args = [];
    for (let i = 1; i <= subtitles.length; i++) {
      args.push(`-map`, `${i}:0`);
    }
    return args;
  })();

  return { subtitlesList, maps };
}

/**
 * Handles mp4 files
 * @param {String} inputVideo Input video location
 * @param {String} folder Folder where the files are located
 * @param {String} outFile Output file location
 * @param {String[]} subtitles List of subtitle files
 */
export async function handleMp4(inputVideo, folder, outFile, subtitles) {
  const { subtitlesList, maps } = parseSubtitlesData(subtitles, folder);
  await $`
    ffmpeg -y \
    -hide_banner \
    -loglevel error \
    -i ${inputVideo} \
    ${subtitlesList} \
    -map 0:v -map 0:a ${maps} \
    -c:v copy -c:a copy \
    -c:s mov_text \
    ${outFile}
  `;
}

/**
 * Handles mkv files
 * @param {String} inputVideo Input video location
 * @param {String} folder Folder where the files are located
 * @param {String} outFile Output file location
 * @param {String[]} subtitles List of subtitle files
 */
export async function handleMkv(inputVideo, folder, outFile, subtitles) {
  const { subtitlesList, maps } = parseSubtitlesData(subtitles, folder);
  await $`
    ffmpeg -y \
    -hide_banner \
    -loglevel error \
    -i ${inputVideo} \
    -sub_charenc 'UTF-8' \
    -f srt \
    ${subtitlesList} \
    -map 0  ${maps} \
    -c:v copy -c:a copy \
    -c:s srt \
    ${outFile}
  `;
}
