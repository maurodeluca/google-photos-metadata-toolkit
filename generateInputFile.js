const fs = require("fs");
const path = require("path");

function usage() {
  console.log(`Usage: node generateInputFile.js <directory> [output_file]
This script generates a list of '<image_path>,<json_path>' mappings.`);
  process.exit(1);
}

const [,, dir, outputFile = "files.data"] = process.argv;
if (!dir) usage();

const exts = new Set([".jpg", ".jpeg", ".png", ".heic", ".gif"]);

fs.writeFileSync(outputFile, ""); // clear output

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith(".json")) {
    const jsonPath = path.join(dir, file);
    const imagePath = path.join(dir, file.replace(/\.json$/, ""));
    if (fs.existsSync(imagePath)) {
      fs.appendFileSync(outputFile, `${imagePath},${jsonPath}\n`);
    } else {
      console.warn(`⚠️  No image for metadata: ${jsonPath}`);
    }
  }
});

console.log(`✅ Input file generated: ${outputFile}`);
