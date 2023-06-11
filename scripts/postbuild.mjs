import fs from "fs";
import workbox from "workbox-build";
import { walkSync } from "./libs/walkSync.mjs";

/**
 * This is run after "npm run build"
 */

{
  const injected_script_base64 = fs.readFileSync("./out/injected_script.js", "base64")

  const original = fs.readFileSync("./out/content_script.js", "utf8")
  const replaced = original.replaceAll("INJECTED_SCRIPT", injected_script_base64)
  fs.writeFileSync("./out/content_script.js", replaced, "utf8")
}

{
  workbox.injectManifest({
    globDirectory: "./out",
    globPatterns: [
      "**\/*.{js,css,html,ico,png,json}",
    ],
    globIgnores: [
      "404.html",
      "chrome\/**\/*",
      "firefox\/**\/*",
      "safari\/**\/*",
    ],
    swSrc: "./out/service_worker.js",
    swDest: "./out/service_worker.js",
    dontCacheBustURLsMatching: /^\/_next\/static\/.*/iu
  })

  const original = fs.readFileSync("./out/service_worker.js", "utf8")
  const replaced = original.replaceAll("self.__WB_PRODUCTION", "true")
  fs.writeFileSync("./out/service_worker.js", replaced, "utf8")
}

for (const filePath of walkSync("./out")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    const original = fs.readFileSync(filePath, "utf8")
    const replaced = original.replaceAll("/_next", "/next")
    fs.writeFileSync(filePath, replaced, "utf8")
  }
}

