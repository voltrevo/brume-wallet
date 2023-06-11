import { RpcClient, RpcRequestPreinit, RpcResponseInit } from "@/libs/rpc"
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

interface JsonRpcResponse {
  id: number
}

class Provider {

  constructor(
    readonly client = new RpcClient()
  ) { }

  get isConnected() {
    return true
  }

  async request(init: RpcRequestPreinit) {
    const request = this.client.create(init)

    const future = new Future<JsonRpcResponse>()

    const onResponse = (e: CustomEvent<RpcResponseInit>) => {
      if (request.id !== e.detail.id)
        return
      future.resolve(e.detail)
    }

    try {
      window.addEventListener("ethereum#response", onResponse)
      window.dispatchEvent(new CustomEvent("ethereum#request", { detail: init }))
      return await future.promise
    } finally {
      window.removeEventListener("ethereum#response", onResponse)
    }
  }

  on(event: string, listener: () => void) {

  }

}

window.ethereum = new Provider()