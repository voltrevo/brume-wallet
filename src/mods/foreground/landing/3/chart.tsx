export function ThreeChart() {
  return <div className="p-4 bg-default-contrast rounded-xl">
    <div className="font-medium text-xl">
      Number of external dependencies
    </div>
    <div className="text-default-contrast">
      Took from package.json — Less is better
    </div>
    <div className="h-4" />
    <div className="w-full">
      <div className={`rounded-xl bg-default-contrast h-12 px-4 w-[60.25%] flex items-center gap-2`}>
        <div className="">
          MetaMask
        </div>
        <div className="text-default-contrast">
          ~720
        </div>
      </div>
      <div className="h-2" />
      <div className={`rounded-xl bg-default-contrast h-12 px-4 w-[95.8%] flex items-center gap-2`}>
        <div className="">
          Rabby
        </div>
        <div className="text-default-contrast">
          ~1150
        </div>
      </div>
      <div className="h-2" />
      <div className={`rounded-xl bg-default-contrast h-12 px-4 w-[64.8%] flex items-center gap-2`}>
        <div className="">
          Rainbow
        </div>
        <div className="text-default-contrast">
          ~780
        </div>
      </div>
      <div className="h-2" />
      <div className="w-full flex items-center">
        <div className={`rounded-xl bg-white text-black h-12 px-4 w-[4.25%] flex items-center gap-2`} />
        <div className="w-4" />
        <div className="flex items-center gap-2">
          <div className="">
            Brume
          </div>
          <div className="text-default-contrast">
            ~50
          </div>
        </div>
      </div>
    </div>
  </div>
}