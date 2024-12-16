import { config } from "dotenv";
import fs from "fs";
import { dirname } from "path";

config({ path: dirname(new URL(import.meta.url).pathname) + "/.env.local" })

const headers = new Headers({ "Authorization": `Bearer ${process.env.IPFS_SECRET}` })
const response = await fetch(`https://ipfs0.hazae41.me:5001/api/v0/swarm/peers`, { method: "POST", headers })

if (!response.ok)
  throw new Error(await response.text())

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