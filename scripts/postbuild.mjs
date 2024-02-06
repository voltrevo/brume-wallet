import fs, { rmSync } from "fs";
import workbox from "workbox-build";
import { walkSync } from "./libs/walkSync.mjs";

{
  rmSync("./out/404.html", { force: true, recursive: true })
  rmSync("./out/test", { force: true, recursive: true })
  rmSync("./out/next/static/chunks/pages/test", { force: true, recursive: true })
}

/**
 * Inline the injected script for Firefox (MV2)
 */
{
  const injected_script_base64 = fs.readFileSync("./out/injected_script.js", "base64")

  const original = fs.readFileSync("./out/content_script.js", "utf8")
  const replaced = original.replaceAll("INJECTED_SCRIPT", injected_script_base64)
  fs.writeFileSync("./out/content_script.js", replaced, "utf8")
}

/**
 * Generate Workbox files for the website to work in offline mode
 */
{
  workbox.injectManifest({
    globDirectory: "./out",
    globPatterns: [
      "**\/*.{js,css,html,ico,png,svg,jpg,json}",
    ],
    globIgnores: [
      "chrome\/**\/*",
      "firefox\/**\/*",
      "safari\/**\/*",
    ],
    swSrc: "./out/service_worker.js",
    swDest: "./out/service_worker.js",
    maximumFileSizeToCacheInBytes: Number.MAX_SAFE_INTEGER,
  })

  const original = fs.readFileSync("./out/service_worker.js", "utf8")
  const replaced = original.replaceAll("self.__WB_PRODUCTION", "true")
  fs.writeFileSync("./out/service_worker.js", replaced, "utf8")
}

/**
 * Rename all "/_next" to "/next" because Chrome doesn't allow "_"
 */
{
  for (const filePath of walkSync("./out")) {
    if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
      const original = fs.readFileSync(filePath, "utf8")
      const replaced = original.replaceAll("/_next", "/next")
      fs.writeFileSync(filePath, replaced, "utf8")
    }
  }
}

