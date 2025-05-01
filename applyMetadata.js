const fs = require("fs");
const readline = require("readline");
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");

function formatTimestamp(unix) {
  if (!unix || isNaN(unix)) return null;
  const date = new Date(Number(unix) * 1000);
  return date.toISOString().replace("T", " ").split(".")[0].replace(/-/g, ":");
}

function convertJson(jsonPath, imagePath) {
  const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const exifData = {
    SourceFile: imagePath,
    Title: json.title || "",
    Description: json.description || "",
    ImageViews: json.imageViews || "",
    CreateDate: formatTimestamp(json.creationTime?.timestamp),
    DateTimeOriginal: formatTimestamp(json.photoTakenTime?.timestamp),
    GPSLatitude: json.geoData?.latitude,
    GPSLongitude: json.geoData?.longitude,
    GPSAltitude: json.geoData?.altitude,
    DeviceType: json.googlePhotosOrigin?.mobileUpload?.deviceType,
    URL: json.url || ""
  };

  const lastModified = formatTimestamp(json.photoLastModifiedTime?.timestamp);
  if (lastModified) exifData.ModifyDate = lastModified;

  const tmpPath = path.join(os.tmpdir(), `exiftool_${path.basename(imagePath)}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify([exifData], null, 2));
  return tmpPath;
}

function applyMetadata(imagePath, jsonPath) {
  const exifJson = convertJson(jsonPath, imagePath);
  return new Promise((resolve, reject) => {
    const child = spawn("exiftool", ["-json=" + exifJson, imagePath]);

    child.on("exit", code => {
      fs.unlinkSync(exifJson);
      code === 0 ? resolve() : reject(new Error(`ExifTool exited with code ${code}`));
    });
  });
}

async function main(inputFile) {
  const lines = fs.readFileSync(inputFile, "utf-8").split("\n").filter(Boolean);
  let count = 0;

  for (const line of lines) {
    count++;
    const [image, json] = line.split(",");
    if (fs.existsSync(image) && fs.existsSync(json)) {
      console.log(`Processing ${count}/${lines.length}: ${image}`);
      try {
        await applyMetadata(image, json);
      } catch (e) {
        console.error(`❌ Failed on ${image}:`, e.message);
      }
    } else {
      console.warn(`⚠️  Missing file in: ${line}`);
    }
  }

  console.log("✅ All files processed.");
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node applyMetadata.js <input_file>");
    process.exit(1);
  }
  main(input);
}
