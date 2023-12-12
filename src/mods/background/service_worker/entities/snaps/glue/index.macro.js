/**
 * @macro delete-next-lines
 */
import fs from "fs/promises"

function $glue$() {
  return (async () => {
    const raw = await fs.readFile(__dirname + "/index.raw.js", "utf8")

    const noexport = raw
      .replaceAll("export { initSync };", "")
      .replaceAll("export default __wbg_init;", "")
      .replaceAll("export ", "")

    return `export function createSnap(bytecode) {
      ${noexport}
      
      initSync(bytecode)

      return Snap
    }`
  })()
}

$glue$()
