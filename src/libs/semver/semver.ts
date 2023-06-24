export namespace Semver {

  export function isGreater(left: string, right: string) {
    const [la, lb, lc] = left.split(".").map(x => parseInt(x))
    const [ra, rb, rc] = right.split(".").map(x => parseInt(x))

    if (la > ra)
      return true
    if (lb > rb)
      return true
    if (lc > rc)
      return true
    return false
  }

}
