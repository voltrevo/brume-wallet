import * as IPFS from "ipfs-http-client"
import { globSource } from "ipfs-http-client"

const ipfs = IPFS.create("/ip4/127.0.0.1/tcp/5001")

/** @type {IPFS.CID} */
let last

for await (const file of ipfs.addAll(globSource("./out", "**/*"), { wrapWithDirectory: true }))
  last = file.cid

const result = await ipfs.name.publish(last, { key: "wallet.brume.money" })

console.log(`/ipns/${result.name}`)
console.log(result.value)