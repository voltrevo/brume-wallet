import * as fs from "fs"

const raw = fs.readFileSync("./index.mdx", "utf8")
const arr = raw.split(/# (..)\n\n/)

for (let i = 1; i < arr.length; i += 2) {
  const title = arr[i]
  const content = arr[i + 1]

  fs.mkdirSync(`./${title}`, { recursive: true })
  fs.writeFileSync(`./${title}/index.mdx`, content)
}