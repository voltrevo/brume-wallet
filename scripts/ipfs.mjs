import { MemoryBlockstore } from "blockstore-core/memory";
import { readFile, writeFile } from "fs/promises";
import { importer } from "ipfs-unixfs-importer";
import path from "path";
import { walkSync } from "./libs/walkSync.mjs";

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

  await writeFile("./dist/.ipfs.md", `https://${last.cid.toString()}.ipfs.nftstorage.link/`)
}

{
  const blockstore = new MemoryBlockstore()

  const source = new Array()

  for (const filePath of walkSync("./dist/website"))
    source.push({ path: path.relative("./dist/website", filePath), content: await readFile(filePath) })

  let last

  for await (const file of importer(source, blockstore, { wrapWithDirectory: true }))
    last = file

  await writeFile("./dist/.website.ipfs.md", `https://${last.cid.toString()}.ipfs.nftstorage.link/`)
}