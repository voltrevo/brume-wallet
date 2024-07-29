import { readFileSync, writeFileSync } from "fs";

const currentRaw = process.env.npm_package_version
const currentCode = Number(currentRaw.replaceAll(".", "")).toString()

const previousRaw = readFileSync("./version.txt", "utf8").trim();
const previousCode = Number(previousRaw.replaceAll(".", "")).toString()

/**
 * Update Android
 */
{
  const original = readFileSync("./apps/android/app/build.gradle", "utf8");

  const updated = original
    .replaceAll(`versionName "${previousRaw}"`, `versionName "${currentRaw}"`)
    .replaceAll(`versionCode ${previousCode}`, `versionCode ${currentCode}`);

  writeFileSync("./apps/android/app/build.gradle", updated);
}

/**
 * Update Apple
 */
{
  const original = readFileSync("./apps/apple/wallet.xcodeproj/project.pbxproj", "utf8");

  const updated = original
    .replaceAll(`MARKETING_VERSION = ${previousRaw};`, `MARKETING_VERSION = ${currentRaw};`)
    .replaceAll(`CURRENT_PROJECT_VERSION = ${previousCode};`, `CURRENT_PROJECT_VERSION = ${currentCode};`);

  writeFileSync("./apps/apple/wallet.xcodeproj/project.pbxproj", updated);
}