import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { Base16 } from "@hazae41/base16";
import { Abi, ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { useMemo } from "react";
import { useSignature } from "../../../signatures/data";
import { useWalletDataContext } from "../../context";
import { useEthereumContext2 } from "../../data";

export function WalletDecodeScreen(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const $state = usePathState<{ data: ZeroHexString }>()
  const [maybeData, setData] = useSearchState("data", $state)

  const maybeHash = Option.wrap(maybeData).mapSync(x => {
    return x.slice(0, 10) as ZeroHexString
  }).inner

  const gnosis = useEthereumContext2(wallet.uuid, chainByChainId[100]).unwrap()

  const signaturesQuery = useSignature(maybeHash, gnosis)
  const triedSignatures = signaturesQuery.current

  if (maybeData == null)
    return null

  return <>
    <Dialog.Title close={close}>
      Decode transaction data
    </Dialog.Title>
    <div className="h-4" />
    <div className="po-md bg-contrast rounded-xl text-contrast whitespace-pre-wrap break-all">
      {maybeData || "0x0"}
    </div>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Matching functions
    </div>
    <div className="h-2" />
    {triedSignatures == null &&
      <div className="grow flex flex-col items-center justify-center">
        <Loading className="size-10" />
      </div>}
    {triedSignatures?.isErr() &&
      <div className="grow flex flex-col items-center justify-center">
        Could not fetch signatures
      </div>}
    {triedSignatures?.isOk() && triedSignatures.get().length === 0 &&
      <div className="grow flex flex-col items-center justify-center">
        No matching function found
      </div>}
    {triedSignatures?.isOk() && triedSignatures.get().length > 0 &&
      <div className="grow flex flex-col gap-2">
        {triedSignatures.get().toReversed().map((text) =>
          <SignatureRow key={text}
            data={maybeData}
            text={text} />)}
      </div>}
  </>
}

export function SignatureRow(props: {
  readonly text: string
  readonly data: ZeroHexString
}) {
  const { text, data } = props

  const triedArgs = useMemo(() => Result.runAndDoubleWrapSync(() => {
    function stringifyOrThrow(x: any): string {
      if (typeof x === "string")
        return x
      if (typeof x === "boolean")
        return String(x)
      if (typeof x === "number")
        return String(x)
      if (typeof x === "bigint")
        return String(x)
      if (x instanceof Uint8Array)
        return ZeroHexString.from(Base16.get().encodeOrThrow(x))
      if (Array.isArray(x))
        return `(${x.map(stringifyOrThrow).join(", ")})`
      return "unknown"
    }

    return Abi.decodeOrThrow(Abi.FunctionSignature.parseOrThrow(text), data).intoOrThrow().map(stringifyOrThrow)
  }), [text, data])

  return <div key={text} className="po-md bg-contrast rounded-xl">
    <div className="break-words">
      {text}
    </div>
    {triedArgs.isErr() &&
      <div className="text-contrast">
        Could not decode arguments
      </div>}
    {triedArgs.isOk() && triedArgs.get().length === 0 &&
      <div className="text-contrast">
        No arguments
      </div>}
    {triedArgs.isOk() && triedArgs.get().length > 0 &&
      <div className="text-contrast whitespace-pre-wrap break-all">
        {triedArgs.get().map((arg, i) =>
          <div key={i}>
            - {arg}
          </div>)}
      </div>}
  </div>
}