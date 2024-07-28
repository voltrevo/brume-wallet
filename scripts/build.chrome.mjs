import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.renameSync("./dist/chrome/_next", "./dist/chrome/next")

  for (const pathname of walkSync("./dist/chrome")) {
    if (pathname.endsWith(".js") || pathname.endsWith(".html")) {
      const original = fs.readFileSync(pathname, "utf8")
      const replaced = original.replaceAll("/_next", "/next")

      fs.writeFileSync(pathname, replaced, "utf8")
    }
  }
}

{
  const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

  const original = fs.readFileSync("./dist/chrome/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", thepackage.version)

  fs.writeFileSync("./dist/chrome/manifest.json", replaced, "utf8")
}

{
  for (const pathname of walkSync("./dist/chrome")) {
    const filename = path.basename(pathname)

    if (!filename.endsWith(".js") && !filename.endsWith(".html"))
      continue

    if (filename === "service_worker.latest.js")
      continue

    const original = fs.readFileSync(pathname, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "false")
      .replaceAll("IS_CHROME", "true")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(pathname, replaced, "utf8")
  }
}

/**
 * Use the latest service worker as the service worker
 */
{
  fs.copyFileSync("./dist/chrome/service_worker.latest.js", "./dist/chrome/service_worker.js")
}