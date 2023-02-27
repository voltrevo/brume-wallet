import { useBoolean } from '../../../libs/react/boolean';
import { CloseProps } from '../../../libs/react/props';
import { OppositeTextButton, OppositeTextButtonDeploy, TextButton } from '../button';
import { DialogFull } from '../modal';

export function NetworkSelectionDialog(props: CloseProps) {
  const blockchain = useBoolean()
  const network = useBoolean()
  const rpc = useBoolean()

  return <DialogFull close={close}>
    <OppositeTextButtonDeploy deploy={blockchain}
      onClick={blockchain.toggle}>
      Blockchain
    </OppositeTextButtonDeploy>
    {blockchain.current &&
      <div className="p-md w-full flex flex-col gap-4 overflow-scroll">
        <TextButton>
          Ethereum
        </TextButton>
        <TextButton>
          Solana
        </TextButton>
        <TextButton>
          Bitcoin
        </TextButton>
      </div>
    }
    <div className='h-4' />
    <OppositeTextButtonDeploy deploy={network}
      onClick={network.toggle}>
      Network
    </OppositeTextButtonDeploy>
    {network.current &&
      <div className="p-md w-full flex flex-col gap-4 overflow-scroll">
        <TextButton>
          Mainet
        </TextButton>
        <TextButton>
          Goerli
        </TextButton>
      </div>
    }
    <div className='h-4' />
    <OppositeTextButtonDeploy deploy={rpc}
      onClick={rpc.toggle}>
      RPC
    </OppositeTextButtonDeploy>
    {rpc.current &&
      <div className="p-md w-full flex flex-col gap-4 overflow-scroll">
        <TextButton>
          Infura
        </TextButton>
        <TextButton>
          Ankr
        </TextButton>
      </div>
    }
    <div className='h-4' />
    <div className='grow' />
    <OppositeTextButton onClick={close}>
      Confirm
    </OppositeTextButton>
  </DialogFull >
}
