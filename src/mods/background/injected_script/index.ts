import { Panic } from "@hazae41/result"

declare global {
  interface Window {
    ethereum?: Provider
  }
}

interface JsonRpcRequestInit {
  method: string
  params?: unknown[]
}

class Provider {

  get isConnected() {
    return true
  }

  async request(request: JsonRpcRequestInit) {
    if (request.method === "eth_requestAccounts")
      return ["0x39dfd20386F5d17eBa42763606B8c704FcDd1c1D"]
    if (request.method === "eth_accounts")
      return ["0x39dfd20386F5d17eBa42763606B8c704FcDd1c1D"]
    if (request.method === "eth_chainId")
      return "0x1"
    if (request.method === "eth_blockNumber")
      return "0x65a8db"
    throw new Panic(`Invalid JSON-RPC request ${request.method}`)
  }

  on(event: string, listener: () => void) {

  }

}

window.ethereum = new Provider()