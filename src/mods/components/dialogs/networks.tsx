import { Dialog } from "@/libs/modals/dialog";
import { CloseProps } from "@/libs/react/props/close";
import { useBoolean } from "../../../libs/react/handles/boolean";
import { OppositeTextButton, OppositeTextButtonDeploy, TextButton } from "../button";

export function NetworkSelectionDialog(props: CloseProps) {
  const { close } = props

  const blockchains = useBoolean()
  const networks = useBoolean()
  const endpoints = useBoolean()

  return <Dialog close={close}>
    <OppositeTextButtonDeploy deploy={blockchains}
      onClick={blockchains.toggle}>
      Blockchain
    </OppositeTextButtonDeploy>
    {blockchains.current &&
      <div className="p-md w-full flex flex-col gap-4 overflow-auto">
        <TextButton>
          Ethereum
        </TextButton>
        <TextButton>
          Solana
        </TextButton>
        <TextButton>
          Bitcoin
        </TextButton>
      </div>}
    <div className="h-4" />
    <OppositeTextButtonDeploy deploy={networks}
      onClick={networks.toggle}>
      Network
    </OppositeTextButtonDeploy>
    {networks.current &&
      <div className="p-md w-full flex flex-col gap-4 overflow-auto">
        <TextButton>
          Mainet
        </TextButton>
        <TextButton>
          Goerli
        </TextButton>
      </div>}
    <div className="h-4" />
    <OppositeTextButtonDeploy deploy={endpoints}
      onClick={endpoints.toggle}>
      RPC
    </OppositeTextButtonDeploy>
    {endpoints.current &&
      <div className="p-md w-full flex flex-col gap-4 overflow-auto">
        <TextButton>
          Infura
        </TextButton>
        <TextButton>
          Ankr
        </TextButton>
      </div>}
    <div className="h-4" />
    <div className="grow" />
    <OppositeTextButton onClick={close}>
      Confirm
    </OppositeTextButton>
  </Dialog>
}
