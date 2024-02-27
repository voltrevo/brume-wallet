import { readFileSync, statSync, writeFileSync } from "fs";

const version = JSON.parse(readFileSync("./package.json", "utf8")).version;
const versionCode = Number(version.replaceAll(".", "")).toString()

{
  const json = JSON.parse(readFileSync("./altstore.json", "utf8"));

  json.apps[0].versions.push({
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