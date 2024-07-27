import fs from "fs";
import { walkSync } from "./libs/walkSync.mjs";

{
  const injected_script_base64 = fs.readFileSync("./dist/safari/injected_script.js", "base64")

  const original = fs.readFileSync("./dist/safari/content_script.js", "utf8")
  const replaced = original.replaceAll("INJECTED_SCRIPT", injected_script_base64)

  fs.writeFileSync("./dist/safari/content_script.js", replaced, "utf8")
}

{
  const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

  const original = fs.readFileSync("./dist/safari/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", thepackage.version)

  fs.writeFileSync("./dist/safari/manifest.json", replaced, "utf8")
}

for (const filePath of walkSync("./dist/safari")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    if (filePath.endsWith("service_worker.latest.js"))
      continue

    const original = fs.readFileSync(filePath, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "true")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(filePath, replaced, "utf8")
  }
}