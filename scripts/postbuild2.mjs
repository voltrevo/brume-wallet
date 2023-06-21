import fs from "fs";

const thepackage = JSON.parse(fs.readFileSync("./package.json", "utf8"))

/**
 * Setup global variables for Chrome
 */
if (fs.existsSync("./dist/chrome")) {
  {
    const original = fs.readFileSync("./dist/chrome/manifest.json", "utf8")
    const replaced = original.replaceAll("VERSION", thepackage.version)

    fs.writeFileSync("./dist/chrome/manifest.json", replaced, "utf8")
  }
  {
    const original = fs.readFileSync("./dist/chrome/content_script.js", "utf8")

    const replaced = original
      .replaceAll("IS_CHROME", "true")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "false")

    fs.writeFileSync("./dist/chrome/content_script.js", replaced, "utf8")
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
  {
    const original = fs.readFileSync("./dist/firefox/content_script.js", "utf8")

    const replaced = original
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "true")
      .replaceAll("IS_SAFARI", "false")

    fs.writeFileSync("./dist/firefox/content_script.js", replaced, "utf8")
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
  {
    const original = fs.readFileSync("./dist/safari/content_script.js", "utf8")

    const replaced = original
      .replaceAll("IS_CHROME", "false")
      .replaceAll("IS_FIREFOX", "false")
      .replaceAll("IS_SAFARI", "true")

    fs.writeFileSync("./dist/safari/content_script.js", replaced, "utf8")
  }
}