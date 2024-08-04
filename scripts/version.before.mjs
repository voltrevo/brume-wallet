import fs from "fs";

const currentRaw = process.env.npm_package_version
const currentCode = parseInt(currentRaw.split(".").at(-1))

const previousRaw = fs.readFileSync("./preversion.txt", "utf8").trim();
const previousCode = parseInt(previousRaw.split(".").at(-1))

/**
 * Update Android
 */
{
  const original = fs.readFileSync("./apps/android/app/build.gradle", "utf8");

  const updated = original
    .replaceAll(`versionName "${previousRaw}"`, `versionName "${currentRaw}"`)
    .replaceAll(`versionCode ${previousCode}`, `versionCode ${currentCode}`);

  fs.writeFileSync("./apps/android/app/build.gradle", updated);
}

/**
 * Update Apple
 */
{
  const original = fs.readFileSync("./apps/apple/wallet.xcodeproj/project.pbxproj", "utf8");

  const updated = original
    .replaceAll(`MARKETING_VERSION = ${previousRaw};`, `MARKETING_VERSION = ${currentRaw};`)
    .replaceAll(`CURRENT_PROJECT_VERSION = ${previousCode};`, `CURRENT_PROJECT_VERSION = ${currentCode};`);

  fs.writeFileSync("./apps/apple/wallet.xcodeproj/project.pbxproj", updated);
}

/**
 * Clean
 */
fs.rmSync("./preversion.txt");