import crypto from "crypto";
import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.rmSync(`./dist/website/404.html`)
}

{
  fs.rmSync(`./dist/website/action.html`)
  fs.rmSync(`./dist/website/popup.html`)
  fs.rmSync(`./dist/website/tabbed.html`)

  fs.rmSync(`./dist/website/content_script.js`)
  fs.rmSync(`./dist/website/injected_script.js`)
  fs.rmSync(`./dist/website/offscreen.js`)
}

{
  fs.rmSync(`./dist/website/chrome`, { recursive: true, force: true })
  fs.rmSync(`./dist/website/firefox`, { recursive: true, force: true })
  fs.rmSync(`./dist/website/safari`, { recursive: true, force: true })
}

{
  const version = process.env.npm_package_version

  const original = fs.readFileSync(`./dist/website/manifest.json`, "utf8")
  const replaced = original.replaceAll("VERSION", version)

  fs.writeFileSync(`./dist/website/manifest.json`, replaced, "utf8")
}

{
  for (const pathname of walkSync(`./dist/website`)) {
    const filename = path.basename(pathname)

    if (!filename.endsWith(".js") && !filename.endsWith(".html"))
      continue

    const original = fs.readFileSync(pathname, "utf8")

    const replaced = original
      .replaceAll("IS_WEBSITE", "true")
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")
      .replaceAll("IS_ANDROID", "false")
      .replaceAll("IS_APPLE", "false")

    fs.writeFileSync(pathname, replaced, "utf8")
  }
}

{
  for (const pathname of walkSync(`./dist/website`)) {
    if (pathname === `dist/website/start.html`)
      continue

    const dirname = path.dirname(pathname)
    const filename = path.basename(pathname)

    if (!filename.endsWith(".html"))
      continue

    fs.copyFileSync(pathname, `./${dirname}/_${filename}`)
    fs.copyFileSync(`./dist/website/start.html`, pathname)
  }

  fs.rmSync(`./dist/website/start.html`)

  const files = new Array()

  for (const pathname of walkSync(`./dist/website`)) {
    if (pathname === `dist/website/service_worker.js`)
      continue

    const dirname = path.dirname(pathname)
    const filename = path.basename(pathname)

    if (fs.existsSync(`./${dirname}/_${filename}`))
      continue
    if (filename.endsWith(`.html`) && fs.existsSync(`./${dirname}/_${filename.slice(0, -5)}/index.html`))
      continue
    if (!filename.endsWith(`.html`) && fs.existsSync(`./${dirname}/_${filename}/index`))
      continue

    const relative = path.relative(`./dist/website`, pathname)

    const text = fs.readFileSync(pathname)
    const hash = crypto.createHash("sha256").update(text).digest("hex")

    files.push([`/${relative}`, hash])
  }

  const original = fs.readFileSync(`./dist/website/service_worker.js`, "utf8")
  const replaced = original.replaceAll("FILES", JSON.stringify(files))

  const version = crypto.createHash("sha256").update(replaced).digest("hex").slice(0, 6)

  fs.writeFileSync(`./dist/website/service_worker.js`, replaced, "utf8")
  fs.writeFileSync(`./dist/website/service_worker.latest.js`, replaced, "utf8")
  fs.writeFileSync(`./dist/website/service_worker.${version}.js`, replaced, "utf8")
}
