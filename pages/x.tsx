import { usePathContext } from "@hazae41/chemin"
import { Address } from "@hazae41/cubane"
import { Nullable } from "@hazae41/option"
import { useEffect, useState } from "react"

export type GnosisRpcRequestInit<T = unknown> = undefined extends T
  ? GnosisRpcParamlessRequestInit<T>
  : GnosisRpcParamfulRequestInit<T>

export interface GnosisRpcParamlessRequestInit<T> {
  readonly id: string
  readonly env: GnosisRpcEnv
  readonly method: string
  readonly params?: T
}

export interface GnosisRpcParamfulRequestInit<T> {
  readonly id: string
  readonly env: GnosisRpcEnv
  readonly method: string
  readonly params: NonNullable<T>
}

export interface GnosisRpcEnv {
  readonly sdkVersion: string
}

export type GnosisRpcResponseInit<T = unknown> =
  | GnosisRpcOk<T>

export interface GnosisRpcOk<T = unknown> {
  readonly id: string
  readonly version: string
  readonly success: true
  readonly data: T
}

export interface GnosisSafeInfo {
  readonly chainId: number
  readonly fallbackHandler: Address.From
  readonly guard: null
  readonly implementation: Address.From
  readonly isReadOnly: boolean
  readonly modules: Address.From[]
  readonly network: "MAINNET"
  readonly nonce: number
  readonly owners: Address.From[]
  readonly safeAddress: Address.From
  readonly threshold: number
  readonly version: "1.1.1"
}

export default function Main() {
  const path = usePathContext().unwrap()

  const [iframe, setIframe] = useState<Nullable<HTMLIFrameElement>>()

  useEffect(() => {
    if (iframe == null)
      return
    const window = iframe.contentWindow

    if (window == null)
      return

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window)
        return
      const request = event.data as GnosisRpcRequestInit

      if (request.method === "getSafeInfo") {
        const { id } = request
        const version = "9.1.0"

        const data: GnosisSafeInfo = {
          chainId: 1,
          fallbackHandler: "0xd5D82B6aDDc9027B22dCA772Aa68D5d74cdBdF44",
          guard: null,
          implementation: "0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F",
          isReadOnly: false,
          modules: ["0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134"],
          network: "MAINNET",
          nonce: 0,
          owners: ['0x9F87C1aCaF3Afc6a5557c58284D9F8609470b571', '0x8712128BEA09C9687Df05A5D692F3750F8086C81', '0x80F59C1D46EFC1Bb18F0AaEc132b77266f00Be9a', '0x9F7dfAb2222A473284205cdDF08a677726d786A0'],
          safeAddress: "0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7",
          threshold: 2,
          version: "1.1.1"
        }

        const response = { id, version, success: true, data }
        event.source.postMessage(response, event.origin)
        return
      }

      console.log(request)
    }

    addEventListener("message", onMessage)
  }, [iframe])

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
    <iframe className="grow w-full"
      ref={setIframe}
      src={path.url.href}
      seamless />
  </main>
}

/* <iframe className="grow w-full"
{...{ csp: "script-src 'sha256-TD+9+AWkrn1zksGv2pO9Z3yZOKpdeQ2v1G9oj6kemWI=';" }}
ref={setIframe}
src={path.url.href}
seamless /> */