import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [name, inlineValue] = token.slice(2).split("=", 2);
    values[name] = inlineValue ?? argv[++index];
  }
  return values;
}

function invariant(condition, message, details) {
  if (condition) return;
  const suffix = details === undefined ? "" : `\n${JSON.stringify(details, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function run(command, args, description) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`${description} failed (${result.status}).\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function filterPath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^([A-Za-z]):/, "$1\\:").replaceAll("'", "\\'");
}

function concatPath(filePath) {
  return filePath.replaceAll("'", "'\\''").replaceAll("\\", "/");
}

function srtTime(seconds) {
  const milliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const timingPath = path.resolve(repoRoot, args.timing ?? "artifacts/demo/scene-timing.json");
const outputDir = path.resolve(repoRoot, args["output-dir"] ?? "artifacts/demo");
const finalPath = path.resolve(outputDir, args.output ?? "cuemend-webmcp-demo.mp4");
const timing = JSON.parse(fs.readFileSync(timingPath, "utf8").replace(/^\uFEFF/, ""));
const scenes = timing.scenes;
invariant(Array.isArray(scenes) && scenes.length > 0, "Scene timing is empty.");
invariant(
  scenes.every((scene) => typeof scene.id === "string" && typeof scene.image === "string" && typeof scene.narration === "string"),
  "Every scene must contain scalar id, image, and narration fields.",
);
invariant(new Set(scenes.map((scene) => scene.id)).size === scenes.length, "Scene ids must be unique.");
fs.mkdirSync(outputDir, { recursive: true });
const segmentDir = path.join(outputDir, "segments");
fs.mkdirSync(segmentDir, { recursive: true });

const regularFont = "C:/Windows/Fonts/segoeui.ttf";
const semiboldFont = fs.existsSync("C:/Windows/Fonts/seguisb.ttf")
  ? "C:/Windows/Fonts/seguisb.ttf"
  : regularFont;
invariant(fs.existsSync(regularFont), "Segoe UI font was not found.");

const segmentPaths = [];
let cursorSeconds = 0;
const srtBlocks = [];

for (let index = 0; index < scenes.length; index += 1) {
  const scene = scenes[index];
  const duration = Number(scene.durationSeconds);
  invariant(Number.isFinite(duration) && duration > 1, `Invalid duration for ${scene.id}.`);
  const imagePath = path.resolve(repoRoot, scene.image);
  invariant(fs.existsSync(imagePath), `Missing scene image: ${imagePath}`);
  const titlePath = path.join(segmentDir, `${scene.id}-title.txt`);
  const subtitlePath = path.join(segmentDir, `${scene.id}-subtitle.txt`);
  fs.writeFileSync(titlePath, `${scene.title}\n`);
  fs.writeFileSync(subtitlePath, `${scene.subtitle}\n`);

  const cropY = scene.crop === "bottom"
    ? "ih-oh"
    : scene.crop === "pan-down"
      ? `(ih-oh)*min(t/${duration.toFixed(3)},1)`
      : "0";
  const boxY = scene.overlay === "top" ? 28 : "h-122";
  const titleY = scene.overlay === "top" ? 48 : "h-102";
  const subtitleY = scene.overlay === "top" ? 80 : "h-70";
  const fadeOutAt = Math.max(0, duration - 0.3).toFixed(3);
  const filter = [
    "scale=1280:-2",
    `crop=1280:720:0:'${cropY}'`,
    "fps=30",
    "format=yuv420p",
    `drawbox=x=30:y=${boxY}:w=w-60:h=94:color=0x08090ddd:t=fill`,
    `drawbox=x=30:y=${boxY}:w=w-60:h=94:color=0x75f3d166:t=2`,
    `drawtext=fontfile='${filterPath(semiboldFont)}':textfile='${filterPath(titlePath)}':fontcolor=0x75f3d1:fontsize=20:x=52:y=${titleY}`,
    `drawtext=fontfile='${filterPath(regularFont)}':textfile='${filterPath(subtitlePath)}':fontcolor=0xf6f3ec:fontsize=28:x=52:y=${subtitleY}`,
    `fade=t=in:st=0:d=0.3`,
    `fade=t=out:st=${fadeOutAt}:d=0.3`,
  ].join(",");
  const segmentPath = path.join(segmentDir, `${String(index + 1).padStart(2, "0")}-${scene.id}.mp4`);
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-loop", "1", "-framerate", "30", "-i", imagePath,
    "-t", duration.toFixed(3),
    "-vf", filter,
    "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", segmentPath,
  ], `Rendering scene ${scene.id}`);
  segmentPaths.push(segmentPath);

  const start = cursorSeconds;
  const end = cursorSeconds + Number(scene.spokenSeconds);
  srtBlocks.push(`${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${scene.narration}\n`);
  cursorSeconds += duration;
}

const concatFile = path.join(segmentDir, "concat.txt");
fs.writeFileSync(concatFile, segmentPaths.map((filePath) => `file '${concatPath(filePath)}'`).join("\n") + "\n");
const silentVideo = path.join(outputDir, "cuemend-silent.mp4");
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "concat", "-safe", "0", "-i", concatFile,
  "-c", "copy", "-movflags", "+faststart", silentVideo,
], "Concatenating video scenes");

const captionsPath = path.join(outputDir, "cuemend-demo-captions.srt");
fs.writeFileSync(captionsPath, srtBlocks.join("\n"));
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", silentVideo, "-i", timing.narration,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-shortest", "-movflags", "+faststart", finalPath,
], "Muxing narration and video");

const probe = JSON.parse(run("ffprobe", [
  "-v", "error", "-show_entries", "format=duration,size:stream=index,codec_type,codec_name,width,height,sample_rate,channels",
  "-of", "json", finalPath,
], "Probing final video"));
const duration = Number(probe.format.duration);
const videoStream = probe.streams.find((stream) => stream.codec_type === "video");
const audioStream = probe.streams.find((stream) => stream.codec_type === "audio");
invariant(duration > 30 && duration < 180, "Final demo must be between 30 and 180 seconds.", probe);
invariant(videoStream?.width === 1280 && videoStream?.height === 720, "Final video must be 1280x720.", probe);
invariant(Boolean(audioStream), "Final video has no audio stream.", probe);

const thumbnailPath = path.join(outputDir, "cuemend-video-thumbnail.jpg");
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-ss", "2", "-i", finalPath, "-frames:v", "1", "-q:v", "2", thumbnailPath,
], "Extracting thumbnail");

const metadata = {
  ok: true,
  output: finalPath,
  captions: captionsPath,
  thumbnail: thumbnailPath,
  durationSeconds: duration,
  sizeBytes: Number(probe.format.size),
  video: videoStream,
  audio: audioStream,
  scenes: scenes.map(({ id, durationSeconds }) => ({ id, durationSeconds })),
};
const metadataPath = path.join(outputDir, "demo-video-metadata.json");
fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);
