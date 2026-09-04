import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const captionsPath = new URL(
  "../docs/verification/cuemend-youtube-captions.srt",
  import.meta.url,
);
const evidencePath = new URL(
  "../docs/verification/demo-video-evidence.json",
  import.meta.url,
);
const scenesPath = new URL("../docs/demo-scenes.json", import.meta.url);

function parseTimestamp(value) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  assert.ok(match, `Invalid SRT timestamp: ${value}`);
  const [, hours, minutes, seconds, milliseconds] = match.map(Number);
  return hours * 3_600 + minutes * 60 + seconds + milliseconds / 1_000;
}

function normalizeNarration(value) {
  return value
    .toLowerCase()
    .replaceAll("32-second", "thirty-two-second")
    .replaceAll("webmcp", "web m c p")
    .replaceAll("sha-256", "s h a two fifty-six")
    .replaceAll("webvtt", "web v t t")
    .replaceAll("’", "'")
    .replace(/[—–]/g, " ")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

test("YouTube captions are complete, readable, structurally valid, and evidence-bound", () => {
  const source = readFileSync(captionsPath, "utf8");
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
  const scenes = JSON.parse(readFileSync(scenesPath, "utf8"));
  const blocks = source.trim().split(/\r?\n\r?\n/).map((block, offset) => {
    const lines = block.split(/\r?\n/);
    assert.equal(Number(lines[0]), offset + 1, "Cue numbers must be sequential");
    const [startText, endText] = lines[1].split(" --> ");
    const textLines = lines.slice(2);
    assert.ok(textLines.length >= 1 && textLines.length <= 2);
    assert.ok(textLines.every((line) => line.length <= 42));
    return {
      start: parseTimestamp(startText),
      end: parseTimestamp(endText),
      startText,
      endText,
      textLines,
    };
  });

  assert.equal(blocks.length, 43);
  assert.ok(blocks[0].start >= 0 && blocks[0].start < 0.25);
  for (const [index, block] of blocks.entries()) {
    assert.ok(block.end > block.start, `Cue ${index + 1} must have positive duration`);
    if (index > 0) {
      assert.ok(
        block.start >= blocks[index - 1].end,
        `Cue ${index + 1} overlaps cue ${index}`,
      );
    }
  }
  assert.ok(blocks.at(-1).end <= evidence.durationSeconds);

  const captionNarration = blocks
    .flatMap((block) => block.textLines)
    .join(" ");
  const sourceNarration = scenes.map((scene) => scene.narration).join(" ");
  assert.equal(normalizeNarration(captionNarration), normalizeNarration(sourceNarration));

  const maximumCharactersPerSecond = Math.max(
    ...blocks.map(
      (block) => block.textLines.join(" ").length / (block.end - block.start),
    ),
  );
  const roundedCps = Math.round(maximumCharactersPerSecond * 100) / 100;
  const maximumLineCharacters = Math.max(
    ...blocks.flatMap((block) => block.textLines.map((line) => line.length)),
  );
  const maximumLinesPerBlock = Math.max(
    ...blocks.map((block) => block.textLines.length),
  );
  const canonicalSource = source.replaceAll("\r\n", "\n");
  const sha256 = createHash("sha256").update(canonicalSource).digest("hex");

  assert.ok(maximumCharactersPerSecond <= 17);
  assert.equal(evidence.youtubeCaptions.sha256, sha256);
  assert.equal(evidence.youtubeCaptions.blocks, blocks.length);
  assert.equal(evidence.youtubeCaptions.completeNarration, true);
  assert.equal(evidence.youtubeCaptions.maximumLinesPerBlock, maximumLinesPerBlock);
  assert.equal(evidence.youtubeCaptions.maximumLineCharacters, maximumLineCharacters);
  assert.equal(evidence.youtubeCaptions.maximumCharactersPerSecond, roundedCps);
  assert.equal(
    evidence.youtubeCaptions.firstTimestamp,
    `${blocks[0].startText} --> ${blocks[0].endText}`,
  );
  assert.equal(
    evidence.youtubeCaptions.lastTimestamp,
    `${blocks.at(-1).startText} --> ${blocks.at(-1).endText}`,
  );
  assert.equal(evidence.youtubeCaptions.alignment.mappedCueStarts, blocks.length);
  assert.equal(evidence.youtubeCaptions.alignment.fallbackCueStarts, 0);
});
