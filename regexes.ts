import { readFileSync } from "fs"

const text = readFileSync("./regexes.txt", "utf8")

function getRegexes(text: string) {
  const regexes = new Array<[number, number]>()

  let index = 0
  let slice = text

  while (true) {
    const match = slice.match(/((return\s*)|(:\s*)|(=\s*)|(\(\s*))(\/.+\/[a-z]*)/)

    if (match == null)
      break
    if (match.index == null)
      break

    const [raw, _pre, _ret, _colon, _equals, _paren, regex] = match

    console.log("a", raw.slice(0, 100))

    let laziest: RegExp | null = null

    for (let i = 1; i < regex.length;) {
      const aaa = regex.indexOf("/", i)

      if (aaa == -1)
        break

      const bbb = regex.indexOf("/", aaa + 1)

      console.log("a2", regex.slice(0, bbb + 1).slice(0, 100), regex.slice(0, aaa + 1).length, regex.length)

      try {
        laziest = eval(`new RegExp(${regex.slice(0, aaa + 1)})`)
        break
      } catch (e) {
        i = aaa + 1
        continue
      }
    }

    if (laziest == null) {
      index += match.index + 1
      slice = text.slice(index)
      continue
    }

    console.log("a3", raw.slice(0, 100))

    const flagsi = index + match.index + raw.length - regex.length + String(laziest).length
    const flagsm = text.slice(flagsi).match(/^[a-z]*/)

    if (flagsm != null) {
      const [flags] = flagsm

      try {
        laziest = new RegExp(laziest, flags)
      } catch (e) {
        index += match.index + 1
        slice = text.slice(index)
        continue
      }
    }

    const start = index + match.index + raw.length - regex.length
    regexes.push([start, start + String(laziest).length])

    console.log("b", text.slice(start, start + String(laziest).length))

    index += match.index + 1
    slice = text.slice(index)
    continue
  }

  return regexes
}

console.log(getRegexes(text).map(([start, end]) => text.slice(start, end)))