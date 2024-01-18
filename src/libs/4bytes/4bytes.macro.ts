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

  const gnosis = new ethers.JsonRpcProvider("https://gnosis.publicnode.com")
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

  async function doFetch(url = "https://www.4byte.directory/api/v1/signatures/?page=589") {
    console.log("Fetching", url)
    const res = await fetch(url)

    if (!res.ok)
      return

    const page = await res.json() as Page
    const names = page.results.map(e => e.text_signature)

    while (true) {
      const feeData = await gnosis.getFeeData()
      console.log("Gas price", feeData.gasPrice)

      if (feeData.gasPrice == null) {
        console.log("Can't fetch gas price")
        await new Promise(resolve => setTimeout(resolve, 60 * 1000))
        continue
      }

      if (feeData.gasPrice > (2n * (10n ** 9n))) {
        console.log("Gas price too high", feeData.gasPrice)
        await new Promise(resolve => setTimeout(resolve, 60 * 1000))
        continue
      }

      break
    }

    try {
      await unsafeBatcher.add(names).then(tx => tx.wait())
    } catch (e) {
      await safeBatcher.add(names).then(tx => tx.wait())
    }

    if (page.next == null)
      return

    await doFetch(page.next)
  }

  await doFetch()
})