import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.rmSync("./dist/firefox/404.html")
}

{
  fs.rmSync("./dist/firefox/chrome", { recursive: true, force: true })
  fs.rmSync("./dist/firefox/firefox", { recursive: true, force: true })
  fs.rmSync("./dist/firefox/safari", { recursive: true, force: true })
}

{
  const injected_script_base64 = fs.readFileSync("./dist/firefox/injected_script.js", "base64")

  const original = fs.readFileSync("./dist/firefox/content_script.js", "utf8")
  const replaced = original.replaceAll("INJECTED_SCRIPT", injected_script_base64)

  fs.writeFileSync("./dist/firefox/content_script.js", replaced, "utf8")
}

{
  const version = process.env.npm_package_version

  const original = fs.readFileSync("./dist/firefox/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", version)

  fs.writeFileSync("./dist/firefox/manifest.json", replaced, "utf8")
}

{
  for (const pathname of walkSync("./dist/firefox")) {
    const filename = path.basename(pathname)

    if (!filename.endsWith(".js") && !filename.endsWith(".html"))
      continue

    const original = fs.readFileSync(pathname, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "true")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(pathname, replaced, "utf8")
  }
}

{
  fs.rmSync("./dist/firefox/start.html")
}