import { RpcClient, RpcRequestPreinit, RpcResponseInit } from "@/libs/rpc"
import { Future } from "@hazae41/future"

declare global {
  interface Window {
    ethereum?: Provider
  }
}

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum#response": CustomEvent<string>
  }
}

const ping = setInterval(() => {
  const detail = JSON.stringify({ id: "ping", jsonrpc: "2.0", method: "brume_ping" })
  window.dispatchEvent(new CustomEvent("ethereum#request", { detail }))
}, 1_000)

class Provider {

  constructor(
    readonly client = new RpcClient()
  ) { }

  isConnected() {
    return true
  }

  async request(init: RpcRequestPreinit<unknown>) {
    const request = this.client.create(init)

    const future = new Future<unknown>()

    const onResponse = (e: CustomEvent<string>) => {
      const response = JSON.parse(e.detail) as RpcResponseInit<unknown>

      if (request.id !== response.id)
        return

      if ("error" in response)
        future.reject(response.error)
      else
        future.resolve(response.result)
    }

    try {
      window.addEventListener("ethereum#response", onResponse)

      const detail = JSON.stringify(request)
      const event = new CustomEvent("ethereum#request", { detail })
      window.dispatchEvent(event)

      return await future.promise
    } finally {
      window.removeEventListener("ethereum#response", onResponse)
    }
  }

  on(event: string, listener: () => void) {

  }

}

window.ethereum = new Provider()