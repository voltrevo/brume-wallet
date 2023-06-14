import { RpcClient, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Future } from "@hazae41/future"

declare global {
  interface Window {
    ethereum?: Provider
  }
}

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum#response": CustomEvent<RpcResponseInit>
  }
}

class Provider {

  constructor(
    readonly client = new RpcClient()
  ) { }

  get isConnected() {
    return true
  }

  async request(init: RpcRequestPreinit<unknown>) {
    const request = this.client.create(init)

    const future = new Future<unknown>()

    const onResponse = (e: CustomEvent<RpcResponseInit>) => {
      const response = RpcResponse.from(e.detail)

      if (request.id !== response.id)
        return

      if (response.isOk())
        future.resolve(response.result)
      else
        future.reject(response.error)
    }

    try {
      window.addEventListener("ethereum#response", onResponse)
      window.dispatchEvent(new CustomEvent("ethereum#request", { detail: request }))
      return await future.promise
    } finally {
      window.removeEventListener("ethereum#response", onResponse)
    }
  }

  on(event: string, listener: () => void) {

  }

}

window.ethereum = new Provider()