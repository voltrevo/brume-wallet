const text = `blabla; return /hello/g; blabla; x = /world\\/hihi/g`

function getRegexes(text: string) {
  const regexes = new Array<RegExp>()

  while (true) {
    const match = text.match(/(return\s*)?(:\s*)?(=\s*)?(\(\s*)?(\/(.|\n)+\/[a-z]*)/)

    if (match == null)
      break
    if (match.index == null)
      break

    const [raw, ret, colon, equal, open, regex] = match

    if (!ret && !colon && !equal && !open) {
      text = text.slice(match.index + 1)
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
      text = text.slice(match.index + 1)
      continue
    }

    const index = match.index + raw.length - regex.length + 1 + laziest.source.length + 1
    const flags = text.slice(index).match(/^[a-z]*/)

    if (flags != null)
      laziest = new RegExp(laziest, flags[0])

    regexes.push(laziest)

    text = text.slice(match.index + 1)
    continue
  }

  return regexes
}

console.log(getRegexes(text))