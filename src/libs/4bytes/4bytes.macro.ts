import { $run$ } from "@hazae41/saumon"
import { ethers } from "ethers"

$run$(async () => {

  interface Page {
    "next": string,
    "previous": null,
    "count": number,
    "results": Element[]
  }

  interface Element {
    "id": number
    "text_signature": string
    "bytes_signature": string,
    "hex_signature": string,
  }

  const gnosis = new ethers.JsonRpcProvider("https://rpc.ankr.com/gnosis")
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, gnosis)

  const abi = [
    {
      "inputs": [
        {
          "internalType": "contract Database",
          "name": "_database",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "string[]",
          "name": "texts",
          "type": "string[]"
        }
      ],
      "name": "add",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const

  const safeBatcher = new ethers.Contract("0x74163cF5905c756F02A5410C1Ee94a3f91FaF996", abi, wallet)
  const unsafeBatcher = new ethers.Contract("0x018c71BCa7aF69b66fEbB0CeFD0590E4725e8e27", abi, wallet)

  let nonce = await wallet.getNonce()
  let feeData = await gnosis.getFeeData()

  let lastFeeDataTimestamp = Date.now()

  async function doFetch(url = "https://www.4byte.directory/api/v1/signatures/?page=1243") {
    console.log(`[${new Date().toLocaleString()}]`, "Fetching", url)
    const res = await fetch(url)

    if (!res.ok)
      return

    const page = await res.json() as Page
    const names = page.results.map(e => e.text_signature)

    while (true) {
      if ((Date.now() - lastFeeDataTimestamp) > (60 * 1000)) {
        feeData = await gnosis.getFeeData()
        lastFeeDataTimestamp = Date.now()
      }

      console.log(`[${new Date().toLocaleString()}]`, "Gas price", feeData.gasPrice)

      if (feeData.gasPrice == null) {
        console.log(`[${new Date().toLocaleString()}]`, "Can't fetch gas price")
        await new Promise(resolve => setTimeout(resolve, 60 * 1000))
        continue
      }

      if (feeData.gasPrice > (16n * (10n ** 8n))) {
        console.log(`[${new Date().toLocaleString()}]`, "Gas price too high", feeData.gasPrice, (16n * (10n ** 8n)))
        await new Promise(resolve => setTimeout(resolve, 60 * 1000))
        continue
      }

      break
    }

    console.log(`[${new Date().toLocaleString()}]`, "Nonce", nonce)

    while (true) {
      try {
        try {
          await unsafeBatcher.add(names, { nonce })
        } catch (e) {
          await safeBatcher.add(names, { nonce })
        }

        break
      } catch (e) {
        console.warn(e)
        await new Promise(ok => setTimeout(ok, 1000))
        continue
      }
    }

    nonce++

    if (page.next == null)
      return

    await doFetch(page.next)
  }

  await doFetch()
})