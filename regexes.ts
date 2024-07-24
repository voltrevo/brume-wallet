import { readFileSync } from "fs"

const text = readFileSync("./regexes.txt", "utf8")

function getRegexes(text: string) {
  const regexes = new Array<[number, number]>()

  let index = 0
  let slice = text

  while (true) {
    const match = slice.match(/(return\s*)?(:\s*)?(=*)?(\(\s*)?(\/.+\/[a-z]*)/)

    if (match == null)
      break
    if (match.index == null)
      break

    const [raw, ret, colon, equal, open, regex] = match

    if (!ret && !colon && !equal && !open) {
      index += match.index + 1
      slice = text.slice(index)
      continue
    }

    console.log(raw.slice(0, 100))

    let laziest: RegExp | null = null

    for (let i = 1; i < regex.length; i++) {
      try {
        laziest = eval(`new RegExp(${regex.slice(0, i)})`)
        break
      } catch (e) { }
    }

    if (laziest == null) {
      index += match.index + 1
      slice = text.slice(index)
      continue
    }

    console.log(laziest)

    const flagsi = index + match.index + raw.length - regex.length + String(laziest).length
    const flagsm = text.slice(flagsi).match(/^[a-z]*/)

    if (flagsm != null)
      laziest = new RegExp(laziest, flagsm[0])

    const start = index + match.index + raw.length - regex.length
    regexes.push([start, start + String(laziest).length])

    console.log(text.slice(start, start + String(laziest).length))

    index += match.index + 1
    slice = text.slice(index)
    continue
  }

  return regexes
}

console.log(getRegexes(text).map(([start, end]) => text.slice(start, end)))