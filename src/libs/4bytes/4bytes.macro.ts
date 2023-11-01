import { ZeroHexString } from "@hazae41/cubane"
import { Nullable } from "@hazae41/option"
import { $run$ } from "@hazae41/saumon"
import { writeFileSync } from "fs"

const data = $run$(async () => {
  interface Data {
    readonly next: Nullable<string>
    readonly results: SignatureData[]
  }

  interface SignatureData {
    readonly text_signature: string
    readonly hex_signature: ZeroHexString
  }

  async function get(url: string) {
    while (true) {
      try {
        const res = await fetch(url)
        const text = await res.text()

        if (text === "Too Many Requests")
          continue
        if (text.startsWith("<"))
          continue
        return JSON.parse(text) as Data
      } catch (e: unknown) { }
    }
  }

  let data: Record<string, string[]> = {}

  for (let i = 0, current = await get(`https://www.4byte.directory/api/v1/signatures/?format=json&page=${i + 1}`); current.next != null; current = await get(current.next), i++) {
    for (const result of current.results) {
      if (data[result.hex_signature] == null)
        data[result.hex_signature] = []
      data[result.hex_signature].push(result.text_signature)
    }

    console.log(10500 - i)

    if (i % 100 !== 99)
      continue
    writeFileSync(`${__dirname}/data/${i + 1}.json`, JSON.stringify(data))
    data = {}
  }

  return data
})