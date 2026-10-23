import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const targets = [
  { dir: "public/images/courses", maxWidth: 1400, quality: 76 },
  { dir: "public/images/site", maxWidth: 1400, quality: 78 },
];

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

for (const target of targets) {
  const dir = path.resolve(target.dir);
  const files = await readdir(dir);

  for (const file of files) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;

    const input = path.join(dir, file);
    const output = path.join(dir, `${path.parse(file).name}.webp`);

    const before = (await stat(input)).size;
    await sharp(input)
      .resize({ width: target.maxWidth, withoutEnlargement: true })
      .webp({ quality: target.quality, effort: 5 })
      .toFile(output);
    const after = (await stat(output)).size;

    console.log(`${file} -> ${path.basename(output)}: ${kb(before)} -> ${kb(after)}`);
  }
}
