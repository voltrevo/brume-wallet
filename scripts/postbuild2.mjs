import fs from "fs";

/**
 * This is run after "npm run build:extension"
 */

{
  const original = fs.readFileSync("./chrome/content_script.js", "utf8")

  const replaced = original
    .replaceAll("IS_CHROME", "true")
    .replaceAll("IS_FIREFOX", "false")
    .replaceAll("IS_SAFARI", "false")

  fs.writeFileSync("./chrome/content_script.js", replaced, "utf8")
}

{
  const original = fs.readFileSync("./firefox/content_script.js", "utf8")

  const replaced = original
    .replaceAll("IS_CHROME", "false")
    .replaceAll("IS_FIREFOX", "true")
    .replaceAll("IS_SAFARI", "false")

  fs.writeFileSync("./firefox/content_script.js", replaced, "utf8")
}

{
  const original = fs.readFileSync("./safari/content_script.js", "utf8")

  const replaced = original
    .replaceAll("IS_CHROME", "false")
    .replaceAll("IS_FIREFOX", "false")
    .replaceAll("IS_SAFARI", "true")

  fs.writeFileSync("./safari/content_script.js", replaced, "utf8")
}