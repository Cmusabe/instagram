import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ICONS = path.join(ROOT, "icons");
const SOURCE_LOGO = path.resolve(ROOT, "..", "..", "files", "InstaClean_Logo-removebg-preview.png");

async function generate() {
  const outputs = [
    [16, "icon-16.png"],
    [48, "icon-48.png"],
    [128, "icon-128.png"],
    [128, "store-icon-128.png"],
  ];

  for (const [size, filename] of outputs) {
    await sharp(SOURCE_LOGO)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(ICONS, filename));
  }
}

await generate();
