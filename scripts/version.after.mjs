import { config } from "dotenv";
import { openAsBlob, readFileSync, statSync, writeFileSync } from "fs";
import path, { dirname } from "path";
import { walkSync } from "./libs/walkSync.mjs";

config({ path: dirname(new URL(import.meta.url).pathname) + "/.env.local" })

{
  const json = JSON.parse(readFileSync("./altstore.json", "utf8"));

  json.apps[0].versions.unshift({
    "version": process.env.npm_package_version,
    "date": new Date().toISOString(),
    "localizedDescription": "See GitHub for changelogs.",
    "downloadURL": `https://github.com/brumewallet/wallet/raw/v${process.env.npm_package_version}/dist/ios-and-ipados.ipa`,
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

  const headers = new Headers({ "Authorization": `Bearer ${process.env.IPFS_SECRET}` })
  const response = await fetch(`https://ipfs0.hazae41.me:5001/api/v0/add?wrap-with-directory=true&cid-version=1`, { method: "POST", headers, body })

  if (!response.ok)
    throw new Error(await response.text())

  const hash = await response.text()
    .then(r => r.split("\n").at(-2))
    .then(JSON.parse)
    .then(r => r.Hash)

  writeFileSync("./dist/.ipfs.md", `https://${hash}.ipfs.ipfs0.hazae41.me/`)
}

{
  const body = new FormData()

  for (const filePath of walkSync("./dist/website"))
    body.append("file", await openAsBlob(filePath), path.relative("./dist/website", filePath))

  const headers = new Headers({ "Authorization": `Bearer ${process.env.IPFS_SECRET}` })
  const response = await fetch(`https://ipfs0.hazae41.me:5001/api/v0/add?wrap-with-directory=true&cid-version=1`, { method: "POST", headers, body })

  if (!response.ok)
    throw new Error(await response.text())

  const hash = await response.text()
    .then(r => r.split("\n").at(-2))
    .then(JSON.parse)
    .then(r => r.Hash)

  writeFileSync("./dist/.website.ipfs.md", `https://${hash}.ipfs.ipfs0.hazae41.me/`)
}