import { Errors } from "@/libs/errors/errors"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { useInputChange, useKeyboardEnter } from "@/libs/react/events"
import { Results } from "@/libs/results/results"
import { WcMetadata } from "@/libs/wconn/mods/wc/wc"
import { Ok, Result } from "@hazae41/result"
import { Decoder } from "@nuintun/qrcode"
import { DecoderResult } from "@nuintun/qrcode/types/qrcode/decoder/Reader"
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react"
import { useBackground } from "../background/context"

export function CameraPage() {
  const background = useBackground().unwrap()

  const mounted = useRef<boolean>(true)

  useEffect(() => () => {
    mounted.current = false
  }, [])

  const video = useRef<HTMLVideoElement>(null)
  const [text, setText] = useState<string>()

  const onStream = useCallback((stream: MediaStream) => {
    if (!video.current) return

    video.current.addEventListener("canplay", () => {
      if (!video.current) return

      const canvas = document.createElement("canvas")
      canvas.width = video.current.videoWidth
      canvas.height = video.current.videoHeight

      const context = canvas.getContext("2d")

      if (!context) return

      function loop() {
        if (!mounted.current) return
        if (!video.current) return
        if (!context) return

        context.drawImage(video.current, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)

        let result: DecoderResult | null = null

        try {
          result = new Decoder().decode(image.data, canvas.width, canvas.height)
        } catch (e: unknown) { }

        if (result != null)
          setText(result.data)
        setTimeout(loop, 100)
      }

      setTimeout(loop, 100)
    })

    video.current.srcObject = stream
    video.current.play()
  }, [])

  useEffect(() => {
    const video = {
      width: { min: 1080 },
      height: { min: 1080 },
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
        params: [uri]
      }).then(r => r.throw(t).throw(t))

      alert(`Connected to ${metadata.name}`)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [background])

  useEffect(() => {
    if (text) tryConnect.run(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const [rawTextInput = "", setRawTextInput] = useState<string>()

  const onTextInputChange = useInputChange(e => {
    setRawTextInput(e.currentTarget.value)
  }, [])

  const textInput = useDeferredValue(rawTextInput)

  const onTextInputEnter = useKeyboardEnter(e => {
    setText(textInput)
  }, [textInput])

  return <>
    <video className="grow w-full object-cover"
      ref={video}
      playsInline
      muted />
    <input className="po-md w-full outline-none"
      placeholder="WalletConnect"
      value={rawTextInput}
      onChange={onTextInputChange}
      onKeyDown={onTextInputEnter} />
  </>
}