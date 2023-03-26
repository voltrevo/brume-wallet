const fs = require('fs');
const path = require('path');

function* walkSync(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name))
    } else {
      yield path.join(dir, file.name)
    }
  }
}

for (const filePath of walkSync("./out")) {
  if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
    const content = fs.readFileSync(filePath, "utf8")
    fs.writeFileSync(filePath, content.replaceAll("_next", "next"), "utf8")
  }
}