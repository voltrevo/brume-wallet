import crypto from "crypto";
import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

{
  fs.renameSync("./dist/website/index.html", "./dist/website/_index.html")
  fs.renameSync("./dist/website/start.html", "./dist/website/index.html")
}

{
  fs.rmSync("./dist/website/404.html")
  fs.rmSync("./dist/website/action.html")
  fs.rmSync("./dist/website/popup.html")
}

{
  fs.rmSync("./dist/website/chrome", { recursive: true, force: true })
  fs.rmSync("./dist/website/firefox", { recursive: true, force: true })
  fs.rmSync("./dist/website/safari", { recursive: true, force: true })
}

{
  const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

  const original = fs.readFileSync("./dist/website/manifest.json", "utf8")
  const replaced = original.replaceAll("VERSION", thepackage.version)

  fs.writeFileSync("./dist/website/manifest.json", replaced, "utf8")
}

{
  for (const pathname of walkSync("./dist/website")) {
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
  const files = new Array()

  for (const pathname of walkSync("./dist/website")) {
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

    const relative = path.relative("./dist/website", pathname)

    files.push([`/${relative}`, hash])
  }

  const original = fs.readFileSync(`./dist/website/service_worker.js`, "utf8")
  const replaced = original.replaceAll("FILES", JSON.stringify(files))

  const version = crypto.createHash("sha256").update(replaced).digest("hex").slice(0, 6)

  fs.writeFileSync(`./dist/website/service_worker.js`, replaced, "utf8")
  fs.writeFileSync(`./dist/website/service_worker.latest.js`, replaced, "utf8")
  fs.writeFileSync(`./dist/website/service_worker.${version}.js`, replaced, "utf8")
}