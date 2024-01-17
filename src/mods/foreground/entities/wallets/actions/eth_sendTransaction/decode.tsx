import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { UrlState } from ".";
import { useSignature } from "../../../signatures/data";
import { useWalletDataContext } from "../../context";
import { useEthereumContext } from "../../data";

export function WalletTransactionScreenDecode(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const $state = usePathState<UrlState>()
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeData, setData] = useSearchState("data", $state)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]

  const context = useEthereumContext(wallet.uuid, chainData)

  const maybeHash = Option.wrap(maybeData).mapSync(x => {
    return x.slice(0, 10) as ZeroHexString
  }).inner

  const signaturesQuery = useSignature(context, maybeHash)
  const maybeSignatures = signaturesQuery.data?.get()

  return <>
    <Dialog.Title close={close}>
      Transact on {chainData.name}
    </Dialog.Title>
    <div className="text-lg font-medium">
      Matching functions
    </div>
    {signaturesQuery.current == null &&
      <div className="grow flex flex-col items-center justify-center">
        <Loading className="size-10" />
      </div>}
    {signaturesQuery.current?.isErr() &&
      <div className="grow flex flex-col items-center justify-center">
        Could not fetch signatures :(
      </div>}
    {signaturesQuery.current?.isOk() && signaturesQuery.current.get().length === 0 &&
      <div className="grow flex flex-col items-center justify-center">
        No matching function found :(
      </div>}
    {signaturesQuery.current?.isOk() && signaturesQuery.current.get().length > 0 &&
      <div className="grow flex flex-col items-center justify-center">
        {signaturesQuery.current.get().map(({ text }) =>
          <div key={text} className="flex flex-col items-center bg-contrast rounded-xl font-medium">
            {text}
          </div>)}
      </div>}
  </>
}