import crypto from "crypto";
import fs from "fs";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

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

    if (filename === "service_worker.latest.js")
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

/**
 * Compute the hash of each file and inject them into the service-worker
 */
{
  const files = new Array()

  for (const pathname of walkSync("./dist/website")) {
    const dirname = path.dirname(pathname)
    const filename = path.basename(pathname)

    if (filename.endsWith(".saumon.js"))
      continue

    if (filename.startsWith("service_worker."))
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

  for (const pathname of walkSync("./dist/website")) {
    const filename = path.basename(pathname)

    if (!filename.startsWith("service_worker."))
      continue

    if (filename === "service_worker.latest.js")
      continue

    const original = fs.readFileSync(pathname, "utf8")
    const replaced = original.replaceAll("FILES", JSON.stringify(files))

    fs.writeFileSync(pathname, replaced, "utf8")
    fs.writeFileSync("./dist/website/service_worker.js", replaced, "utf8")

    break
  }
}