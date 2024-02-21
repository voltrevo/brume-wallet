import { readFileSync, writeFileSync } from "fs";

const version = JSON.parse(readFileSync("./package.json", "utf8")).version;
const versionCode = Number(version.replaceAll(".", "")).toString()

const previous = readFileSync("./dist/version.txt", "utf8");
const previousCode = Number(previous.replaceAll(".", "")).toString()

/**
 * Update Android
 */
{
  const original = readFileSync("./apps/android/app/build.gradle", "utf8");

  const updated = original
    .replaceAll(`versionName "${previous}"`, `versionName "${version}"`)
    .replaceAll(`versionCode ${previousCode}`, `versionCode ${versionCode}`);

  writeFileSync("./apps/android/app/build.gradle", updated);
}

/**
 * Update Apple
 */
{
  const original = readFileSync("./apps/apple/wallet.xcodeproj/project.pbxproj", "utf8");

  const updated = original
    .replaceAll(`MARKETING_VERSION = ${previous};`, `MARKETING_VERSION = ${version};`)
    .replaceAll(`CURRENT_PROJECT_VERSION = ${previousCode};`, `CURRENT_PROJECT_VERSION = ${versionCode};`);

  writeFileSync("./apps/apple/wallet.xcodeproj/project.pbxproj", updated);
}