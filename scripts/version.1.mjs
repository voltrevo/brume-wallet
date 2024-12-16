import { config } from "dotenv";
import { dirname } from "path";

config({ path: dirname(new URL(import.meta.url).pathname) + "/.env.local" })

console.log(dirname(new URL(import.meta.url).pathname) + "/.env.local", process.env.IPFS_SECRET)

const headers = new Headers({ "Authorization": `Bearer ${process.env.IPFS_SECRET}` })
const response = await fetch(`https://ipfs0.hazae41.me:5001/api/v0/swarm/peers`, { method: "POST", headers })

if (!response.ok)
  throw new Error(await response.text())

console.log("Ready to release!")