/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors/errors"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { UUIDProps } from "@/libs/react/props/uuid"
import { Results } from "@/libs/results/results"
import { WcMetadata } from "@/libs/wconn/mods/wc/wc"
import { Ok, Result } from "@hazae41/result"
import { Decoder } from "@nuintun/qrcode"
import { DecoderResult } from "@nuintun/qrcode/types/qrcode/decoder/Reader"
import { useCallback, useEffect, useRef, useState } from "react"
import { useBackgroundContext } from "../../../background/context"
import { WalletDataProvider, useWalletDataContext } from "../context"

export function WalletCameraPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataCameraPage />
  </WalletDataProvider>
}

export function WalletDataCameraPage() {
  const wallet = useWalletDataContext()
  const background = useBackgroundContext().unwrap()

  const mounted = useRef<boolean>(true)

  useEffect(() => () => {
    mounted.current = false
  }, [])

  const video = useRef<HTMLVideoElement>(null)
  const sight = useRef<HTMLImageElement>(null)
  const [text, setText] = useState<string>()

  const onStream = useCallback((stream: MediaStream) => {
    if (!video.current) return
    if (!sight.current) return

    video.current.addEventListener("canplay", () => {
      if (!video.current) return
      if (!sight.current) return

      const yratio = video.current.videoHeight / video.current.clientHeight
      const xratio = video.current.videoWidth / video.current.clientWidth

      const ratio = Math.min(yratio, xratio)

      const cw = video.current.clientWidth * ratio
      const ch = video.current.clientHeight * ratio
      const cx = (video.current.videoWidth / 2) - (cw / 2)
      const cy = (video.current.videoHeight / 2) - (ch / 2)

      const sx = cx + (sight.current.offsetLeft * ratio)
      const sy = cy + (sight.current.offsetTop * ratio)
      const sw = sight.current.offsetWidth * ratio
      const sh = sight.current.offsetHeight * ratio

      const canvas = document.createElement("canvas")
      canvas.width = sw
      canvas.height = sh

      const canvasCtx = canvas.getContext("2d")

      if (!canvasCtx) return

      function loop() {
        if (!mounted.current) return
        if (!video.current) return
        if (!sight.current) return
        if (!canvasCtx) return

        canvasCtx.drawImage(video.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        const image = canvasCtx.getImageData(0, 0, sw, sh)

        let result: DecoderResult | null = null

        try {
          result = new Decoder().decode(image.data, canvas.width, canvas.height)
        } catch (e: unknown) { }

        if (result != null)
          setText(result.data)
        setTimeout(loop, 1000)
      }

      setTimeout(loop, 1000)
    })

    video.current.srcObject = stream
    video.current.play()
  }, [])

  useEffect(() => {
    const video: MediaTrackConstraints = {
      width: { ideal: 1080 },
      height: { ideal: 1080 },
      facingMode: { exact: "environment" }
    }

    navigator.mediaDevices.getUserMedia({ video })
      .then(onStream)
      .catch(Errors.logAndAlert)
  }, [onStream])

  const tryConnect = useAsyncUniqueCallback(async (uri: string) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      alert(`Connecting...`)

      const metadata = await background.tryRequest<WcMetadata>({
        method: "brume_wc_connect",
        params: [uri, wallet.uuid]
      }).then(r => r.throw(t).throw(t))

      alert(`Connected to ${metadata.name}`)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [background, wallet])

  useEffect(() => {
    if (text) tryConnect.run(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return <>
    <div className="grow relative flex flex-col">
      <div className="absolute w-full h-full flex flex-col items-center justify-center">
        <img className="h-16 w-16"
          src="/assets/wc.svg"
          alt="WalletConnect" />
      </div>
      <div className="absolute w-full h-full flex flex-col items-center justify-center">
        <img className="h-64 w-64"
          ref={sight}
          src="/assets/sight.svg"
          alt="sight" />
      </div>
      <video className="grow w-full object-cover"
        ref={video}
        playsInline
        muted />
    </div>
  </>
}