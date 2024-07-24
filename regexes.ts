const text = `blabla; return /hello/g; blabla; x = /world\\/hihi/g`

function getRegexes(text: string) {
  const regexes = new Array<[number, number]>()

  let index = 0
  let slice = text

  while (true) {
    const match = slice.match(/(return\s*)?(:\s*)?(=\s*)?(\(\s*)?(\/(.|\n)+\/[a-z]*)/)

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

    let lazier = regex

    let laziest: RegExp | null = null

    while (lazier) {
      try {
        laziest = eval(`new RegExp(${lazier})`)
      } catch (e) { }

      lazier = lazier.slice(0, -1)
    }

    if (laziest == null) {
      index += match.index + 1
      slice = text.slice(index)
      continue
    }

    const flagsi = index + match.index + raw.length - regex.length + String(laziest).length
    const flagsm = text.slice(flagsi).match(/^[a-z]*/)

    if (flagsm != null)
      laziest = new RegExp(laziest, flagsm[0])

    const start = index + match.index + raw.length - regex.length
    regexes.push([start, start + String(laziest).length])

    index += match.index + 1
    slice = text.slice(index)
    continue
  }

  return regexes
}

console.log(getRegexes(text).map(([start, end]) => text.slice(start, end)))