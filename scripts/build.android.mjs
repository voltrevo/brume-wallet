import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.rmSync("./dist/android/404.html")
}

{
  fs.rmSync("./dist/android/action.html")
  fs.rmSync("./dist/android/popup.html")

  fs.rmSync(`./dist/android/content_script.js`)
  fs.rmSync(`./dist/android/injected_script.js`)
  fs.rmSync(`./dist/android/offscreen.js`)
}

{
  fs.rmSync("./dist/android/chrome", { recursive: true, force: true })
  fs.rmSync("./dist/android/firefox", { recursive: true, force: true })
  fs.rmSync("./dist/android/safari", { recursive: true, force: true })
}

{
  const version = process.env.npm_package_version

  const original = fs.readFileSync("./dist/android/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", version)

  fs.writeFileSync("./dist/android/manifest.json", replaced, "utf8")
}

{
  for (const pathname of walkSync("./dist/android")) {
    const filename = path.basename(pathname)

    if (!filename.endsWith(".js") && !filename.endsWith(".html"))
      continue

    const original = fs.readFileSync(pathname, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "true")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(pathname, replaced, "utf8")
  }
}

{
  fs.rmSync("./dist/android/start.html")
}