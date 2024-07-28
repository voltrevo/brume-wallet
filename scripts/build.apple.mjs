import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.rmSync("./dist/apple/chrome", { recursive: true, force: true })
  fs.rmSync("./dist/apple/firefox", { recursive: true, force: true })
  fs.rmSync("./dist/apple/safari", { recursive: true, force: true })
}

{
  const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

  const original = fs.readFileSync("./dist/apple/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", thepackage.version)

  fs.writeFileSync("./dist/apple/manifest.json", replaced, "utf8")
}

{
  for (const pathname of walkSync("./dist/apple")) {
    const filename = path.basename(pathname)

    if (!filename.endsWith(".js") && !filename.endsWith(".html"))
      continue

    const original = fs.readFileSync(pathname, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "true")

    fs.writeFileSync(pathname, replaced, "utf8")
  }
}