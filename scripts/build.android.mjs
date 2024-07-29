import crypto from "crypto";
import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";


{
  fs.rmSync("./dist/android/start.html")
}

{
  fs.rmSync("./dist/android/404.html")
  fs.rmSync("./dist/android/action.html")
  fs.rmSync("./dist/android/popup.html")
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

/**
 * Compute the hash of each file and inject them into the service-worker
 */
{
  const files = new Array()

  for (const pathname of walkSync("./dist/android")) {
    const dirname = path.dirname(pathname)
    const filename = path.basename(pathname)

    if (filename === "service_worker.js")
      continue

    if (fs.existsSync(`./${dirname}/_${filename}`))
      continue
    if (filename.endsWith(".html") && fs.existsSync(`./${dirname}/_${filename.slice(0, -5)}/index.html`))
      continue
    if (!filename.endsWith(".html") && fs.existsSync(`./${dirname}/_${filename}/index`))
      continue

    const text = fs.readFileSync(pathname)
    const hash = crypto.createHash("sha256").update(text).digest("hex")

    const relative = path.relative("./dist/android", pathname)

    files.push([`/${relative}`, hash])
  }

  const original = fs.readFileSync(`./dist/android/service_worker.js`, "utf8")
  const replaced = original.replaceAll("FILES", JSON.stringify(files))

  const version = crypto.createHash("sha256").update(replaced).digest("hex").slice(0, 6)

  fs.writeFileSync(`./dist/android/service_worker.js`, replaced, "utf8")
  fs.writeFileSync(`./dist/android/service_worker.latest.js`, replaced, "utf8")
  fs.writeFileSync(`./dist/android/service_worker.${version}.js`, replaced, "utf8")
}