import { readFileSync } from "fs"

const text = readFileSync("./regexes.txt", "utf8")

function getRegexes(text: string) {
  const regexes = new Array<[number, number]>()

  let index = 0
  let slice = text

  while (true) {
    const match = slice.match(/((return\s*)|(\:\s*)|(\=\s*)|(\(\s*))(\/((?![*+?])(?:[^\r\n\[\/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/[gimsuy]{0,6})((\s*\.)|(\s*\,)|(\s*\;)|(\s*\)))/)

    if (match == null)
      break
    if (match.index == null)
      break

    const [raw, _pre, _ret, _colon, _equals, _paren, regex] = match

    console.log("!a!", regex)

    try {
      eval(`new RegExp(${regex})`)
    } catch (e) {
      index += match.index + 1
      slice = text.slice(index)
      continue
    }

    const start = index - 1 + match.index + raw.length - regex.length
    regexes.push([start, start + regex.length])

    console.log("!b!", text.slice(start, start + regex.length))

    index += match.index + 1
    slice = text.slice(index)
    continue
  }

  return regexes
}

console.log(getRegexes(text).map(([start, end]) => text.slice(start, end)))