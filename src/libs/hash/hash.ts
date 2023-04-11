export namespace Hash {

  export function from(seed: string, length: number) {
    let index = 0

    for (let i = 0; i < seed.length; i++)
      index = (index + seed.charCodeAt(i)) % length

    return index
  }

}