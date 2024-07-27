import fs from "fs";
import { walkSync } from "./libs/walkSync.mjs";

{
  const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

  const original = fs.readFileSync("./dist/website/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", thepackage.version)

  fs.writeFileSync("./dist/website/manifest.json", replaced, "utf8")
}

for (const filePath of walkSync("./dist/website")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    if (filePath.endsWith("service_worker.latest.js"))
      continue

    const original = fs.readFileSync(filePath, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "true")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(filePath, replaced, "utf8")
  }
}