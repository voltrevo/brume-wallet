import fs from "fs";
import { walkSync } from "./libs/walkSync.mjs";

{
  const injected_script_base64 = fs.readFileSync("./dist/firefox/injected_script.js", "base64")

  const original = fs.readFileSync("./dist/firefox/content_script.js", "utf8")
  const replaced = original.replaceAll("INJECTED_SCRIPT", injected_script_base64)

  fs.writeFileSync("./dist/firefox/content_script.js", replaced, "utf8")
}

{
  const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

  const original = fs.readFileSync("./dist/firefox/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", thepackage.version)

  fs.writeFileSync("./dist/firefox/manifest.json", replaced, "utf8")
}

for (const filePath of walkSync("./dist/firefox")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    if (filePath.endsWith("service_worker.latest.js"))
      continue

    const original = fs.readFileSync(filePath, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "true")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(filePath, replaced, "utf8")
  }
}