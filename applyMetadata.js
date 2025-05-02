const fs = require("fs");
const os = require("os");
const path = require("path");
const { exiftool } = require("exiftool-vendored");

function formatTimestamp(unix) {
  if (!unix || isNaN(unix)) return null;
  const date = new Date(Number(unix) * 1000);
  return date.toISOString().replace("T", " ").split(".")[0].replace(/-/g, ":");
}

function buildExifData(jsonPath, imagePath) {
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

  return exifData;
}

async function applyMetadata(imagePath, jsonPath) {
  const exifData = buildExifData(jsonPath, imagePath);

  try {
    await exiftool.write(imagePath, exifData);
    console.log(`✅ Metadata applied to ${imagePath}`);
  } catch (error) {
    console.error(`❌ Failed to write metadata for ${imagePath}:`, error);
    throw error;
  }
}

module.exports = { applyMetadata };

// Optional: cleanup on shutdown
process.on("exit", () => {
  exiftool.end();
});
