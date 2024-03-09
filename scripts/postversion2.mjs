import { config } from "dotenv";
import { openAsBlob, readFileSync, statSync, writeFileSync } from "fs";
import path, { dirname } from "path";
import { walkSync } from "./libs/walkSync.mjs";

config({ path: dirname(new URL(import.meta.url).pathname) + "/.env.local" })

const version = JSON.parse(readFileSync("./package.json", "utf8")).version;
const versionCode = Number(version.replaceAll(".", "")).toString()

{
  const json = JSON.parse(readFileSync("./altstore.json", "utf8"));

  json.apps[0].versions.unshift({
    "version": version,
    "date": new Date().toISOString(),
    "localizedDescription": "Improvements and fixes. See GitHub for more details.",
    "downloadURL": `https://github.com/brumewallet/wallet/raw/v${version}/dist/ios-and-ipados.ipa`,
    "size": statSync("./dist/ios-and-ipados.ipa").size,
    "sha256": Buffer.from(await crypto.subtle.digest("SHA-256", readFileSync("./dist/ios-and-ipados.ipa"))).toString("hex"),
    "minOSVersion": "15.0"
  })

  writeFileSync("./altstore.json", JSON.stringify(json, null, 2));
}

{
  const body = new FormData()

  body.append("file", await openAsBlob("./dist/website.zip"), "website.zip");
  body.append("file", await openAsBlob("./dist/chrome.zip"), "chrome.zip");
  body.append("file", await openAsBlob("./dist/firefox.zip"), "firefox.zip");
  body.append("file", await openAsBlob("./dist/android.apk"), "android.apk");
  body.append("file", await openAsBlob("./dist/ios-and-ipados.ipa"), "ios-and-ipados.ipa");
  body.append("file", await openAsBlob("./dist/macos.zip"), "macos.zip");

  const headers = { "Authorization": `Bearer ${process.env.NFTSTORAGE_TOKEN}` }
  const response = await fetch("https://api.nft.storage/upload", { method: "POST", headers, body })

  if (!response.ok)
    throw new Error(await response.text())

  const result = await response.json()

  if (!result.ok)
    throw new Error(result.error.message)

  writeFileSync("./dist/.ipfs.md", `https://${result.value.cid}.ipfs.nftstorage.link/`)
}

{
  const body = new FormData()

  for (const filePath of walkSync("./dist/website")) {
    body.append("file", await openAsBlob(filePath), path.relative("./dist/website", filePath))
  }

  const headers = { "Authorization": `Bearer ${process.env.NFTSTORAGE_TOKEN}` }
  const response = await fetch("https://api.nft.storage/upload", { method: "POST", headers, body })

  if (!response.ok)
    throw new Error(await response.text())

  const result = await response.json()

  if (!result.ok)
    throw new Error(result.error.message)

  writeFileSync("./dist/.website.ipfs.md", `https://${result.value.cid}.ipfs.nftstorage.link/`)
}