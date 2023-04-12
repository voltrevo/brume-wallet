export namespace Address {

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}