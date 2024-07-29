import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.rmSync("./dist/chrome/chrome", { recursive: true, force: true })
  fs.rmSync("./dist/chrome/firefox", { recursive: true, force: true })
  fs.rmSync("./dist/chrome/safari", { recursive: true, force: true })
}

{
  const version = process.env.npm_package_version

  const original = fs.readFileSync("./dist/chrome/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", version)

  fs.writeFileSync("./dist/chrome/manifest.json", replaced, "utf8")
}

{
  fs.renameSync("./dist/chrome/_next", "./dist/chrome/next")

  for (const pathname of walkSync("./dist/chrome")) {
    const filename = path.basename(pathname)

    if (!filename.endsWith(".js") && !filename.endsWith(".html"))
      continue

    const original = fs.readFileSync(pathname, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "true")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")
      .replaceAll("/_next", "/next")

    fs.writeFileSync(pathname, replaced, "utf8")
  }
}