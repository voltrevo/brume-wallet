import fs from "fs";
import path from "path";
import { injectManifest } from "workbox-build";

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

injectManifest({
  globDirectory: "./out",
  swSrc: "./out/service_worker.js",
  swDest: "./out/service_worker.js",
  dontCacheBustURLsMatching: /^\/_next\/static\/.*/iu
})

for (const filePath of walkSync("./out")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    const content = fs.readFileSync(filePath, "utf8")
    fs.writeFileSync(filePath, content.replaceAll("/_next", "/next"), "utf8")
  }
}

