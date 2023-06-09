import fs from "fs";
import path from "path";
import workbox from "workbox-build";

function* walkSync(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name))
    } else {
      yield path.join(dir, file.name)
    }
  }
}

workbox.injectManifest({
  globDirectory: "./out",
  swSrc: "./out/service_worker.js",
  swDest: "./out/service_worker.js",
  dontCacheBustURLsMatching: /^\/_next\/static\/.*/iu
})

const original = fs.readFileSync("./out/service_worker.js", "utf8")
const replaced = original.replaceAll("self.__WB_PRODUCTION", "true")
fs.writeFileSync("./out/service_worker.js", replaced, "utf8")

for (const filePath of walkSync("./out")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    const original = fs.readFileSync(filePath, "utf8")
    const replaced = original.replaceAll("/_next", "/next")
    fs.writeFileSync(filePath, replaced, "utf8")
  }
}

