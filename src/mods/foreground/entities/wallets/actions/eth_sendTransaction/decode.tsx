import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { UrlState } from ".";
import { useSignature } from "../../../signatures/data";
import { useWalletDataContext } from "../../context";
import { useEthereumContext2 } from "../../data";

export function WalletTransactionScreenDecode(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const $state = usePathState<UrlState>()
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeData, setData] = useSearchState("data", $state)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]

  const maybeHash = Option.wrap(maybeData).mapSync(x => {
    return x.slice(0, 10) as ZeroHexString
  }).inner

  const gnosis = useEthereumContext2(wallet.uuid, chainByChainId[100]).unwrap()

  const signaturesQuery = useSignature(maybeHash, gnosis)
  const maybeSignatures = signaturesQuery.current?.ok().get()
  const errorSignatures = signaturesQuery.current?.err().get()

  return <>
    <Dialog.Title close={close}>
      Transact on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <div className="po-md bg-contrast rounded-xl text-contrast whitespace-pre-wrap break-words">
      {maybeData || "0x0"}
    </div>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Matching functions
    </div>
    <div className="h-2" />
    {maybeSignatures == null && errorSignatures == null &&
      <div className="grow flex flex-col items-center justify-center">
        <Loading className="size-10" />
      </div>}
    {maybeSignatures == null && errorSignatures != null &&
      <div className="grow flex flex-col items-center justify-center">
        Could not fetch signatures :(
      </div>}
    {maybeSignatures != null && maybeSignatures.length === 0 &&
      <div className="grow flex flex-col items-center justify-center">
        No matching function found :(
      </div>}
    {maybeSignatures != null && maybeSignatures.length > 0 &&
      <div className="grow flex flex-col">
        {maybeSignatures.map((text) =>
          <div key={text} className="po-md flex items-center bg-contrast rounded-xl">
            {text}
          </div>)}
      </div>}
  </>
}