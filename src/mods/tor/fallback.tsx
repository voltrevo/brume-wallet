export function TorFallback() {
  return <div className="p-md flex flex-col items-center">
    <div className="h-2" />
    <div className="flex items-center gap-4">
      <span className="text-3xl text-center text-colored">
        Brume Wallet
      </span>
    </div>
    <div className="h-[150px]" />
    <div className="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    <div className="h-[100px]" />
    <span className="text-2xl text-center">
      Connecting to Tor...
    </span>
    <div className="h-[20px]" />
    <span className="text-center text-contrast">
      It may take a few seconds. If it freezes, close the extension window and open it again.
    </span>
  </div>
}