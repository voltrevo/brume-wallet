import { MemoryBlockstore } from "blockstore-core/memory";
import fs from "fs";
import { readFile, writeFile } from "fs/promises";
import { importer } from "ipfs-unixfs-importer";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

if (fs.existsSync("./dist/website")) {
  {
    const original = fs.readFileSync("./dist/website/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/website/manifest.json", replaced, "utf8")
  }

  for (const filePath of walkSync("./dist/website")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
      const original = fs.readFileSync(filePath, "utf8")

      const replaced = original
        .replaceAll("IS_WEBSITE", "true")
        .replaceAll("IS_CHROME", "false")
        .replaceAll("IS_FIREFOX", "false")
        .replaceAll("IS_SAFARI", "false")
        .replaceAll("IS_ANDROID", "false")
        .replaceAll("IS_APPLE", "false")

      fs.writeFileSync(filePath, replaced, "utf8")
    }
  }
}

/**
 * Setup global variables for Chrome
 */
if (fs.existsSync("./dist/chrome")) {
  {
    const original = fs.readFileSync("./dist/chrome/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/chrome/manifest.json", replaced, "utf8")
  }

  for (const filePath of walkSync("./dist/chrome")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
      const original = fs.readFileSync(filePath, "utf8")

      const replaced = original
        .replaceAll("IS_WEBSITE", "false")
        .replaceAll("IS_CHROME", "true")
        .replaceAll("IS_FIREFOX", "false")
        .replaceAll("IS_SAFARI", "false")
        .replaceAll("IS_ANDROID", "false")
        .replaceAll("IS_APPLE", "false")

      fs.writeFileSync(filePath, replaced, "utf8")
    }
  }
}

/**
 * Setup global variables for Firefox
 */
if (fs.existsSync("./dist/firefox")) {
  {
    const original = fs.readFileSync("./dist/firefox/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/firefox/manifest.json", replaced, "utf8")
  }

  for (const filePath of walkSync("./dist/firefox")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
      const original = fs.readFileSync(filePath, "utf8")

      const replaced = original
        .replaceAll("IS_WEBSITE", "false")
        .replaceAll("IS_CHROME", "false")
        .replaceAll("IS_FIREFOX", "true")
        .replaceAll("IS_SAFARI", "false")
        .replaceAll("IS_ANDROID", "false")
        .replaceAll("IS_APPLE", "false")

      fs.writeFileSync(filePath, replaced, "utf8")
    }
  }
}

/**
 * Setup global variables for Safari
 */
if (fs.existsSync("./dist/safari")) {
  {
    const original = fs.readFileSync("./dist/safari/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/safari/manifest.json", replaced, "utf8")
  }

  for (const filePath of walkSync("./dist/safari")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
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
}

/**
 * Setup global variables for Android
 */
if (fs.existsSync("./dist/android")) {
  {
    const original = fs.readFileSync("./dist/android/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/android/manifest.json", replaced, "utf8")
  }

  for (const filePath of walkSync("./dist/android")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
      const original = fs.readFileSync(filePath, "utf8")

      const replaced = original
        .replaceAll("IS_WEBSITE", "false")
        .replaceAll("IS_CHROME", "false")
        .replaceAll("IS_FIREFOX", "false")
        .replaceAll("IS_SAFARI", "false")
        .replaceAll("IS_ANDROID", "true")
        .replaceAll("IS_APPLE", "false")

      fs.writeFileSync(filePath, replaced, "utf8")
    }
  }
}

/**
 * Setup global variables for Apple
 */
if (fs.existsSync("./dist/apple")) {
  {
    const original = fs.readFileSync("./dist/apple/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/apple/manifest.json", replaced, "utf8")
  }

  for (const filePath of walkSync("./dist/apple")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
      const original = fs.readFileSync(filePath, "utf8")

      const replaced = original
        .replaceAll("IS_WEBSITE", "false")
        .replaceAll("IS_CHROME", "false")
        .replaceAll("IS_FIREFOX", "false")
        .replaceAll("IS_SAFARI", "false")
        .replaceAll("IS_ANDROID", "false")
        .replaceAll("IS_APPLE", "true")

      fs.writeFileSync(filePath, replaced, "utf8")
    }
  }
}

{
  const blockstore = new MemoryBlockstore()

  const source = new Array()

  source.push({ path: "website.zip", content: await readFile("./dist/website.zip") })
  source.push({ path: "chrome.zip", content: await readFile("./dist/chrome.zip") })
  source.push({ path: "firefox.zip", content: await readFile("./dist/firefox.zip") })
  source.push({ path: "android.apk", content: await readFile("./dist/android.apk") })
  source.push({ path: "ios-and-ipados.ipa", content: await readFile("./dist/ios-and-ipados.ipa") })
  source.push({ path: "macos.zip", content: await readFile("./dist/macos.zip") })

  let last

  for await (const file of importer(source, blockstore, { wrapWithDirectory: true }))
    last = file

  await writeFile("./dist/.ipfs.md", `https://${last.cid.toString()}.ipfs.cf-ipfs.com/`)
}

{
  const blockstore = new MemoryBlockstore()

  const source = new Array()

  for (const filePath of walkSync("./dist/website"))
    source.push({ path: path.relative("./dist/website", filePath), content: await readFile(filePath) })

  let last

  for await (const file of importer(source, blockstore, { wrapWithDirectory: true }))
    last = file

  await writeFile("./dist/.website.ipfs.md", `https://${last.cid.toString()}.ipfs.cf-ipfs.com/`)
}