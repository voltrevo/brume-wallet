import { Decoder } from "@nuintun/qrcode"
import { DecoderResult } from "@nuintun/qrcode/types/qrcode/decoder/Reader"
import { useCallback, useEffect, useRef, useState } from "react"

export function CameraPage() {
  const mounted = useRef<boolean>(true)

  useEffect(() => () => {
    mounted.current = false
  }, [])

  const video = useRef<HTMLVideoElement>(null)
  const [text, setText] = useState<string>()

  const onStream = useCallback((stream: MediaStream) => {
    if (!video.current) return

    video.current.addEventListener("canplay", () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.current!.videoWidth
      canvas.height = video.current!.videoHeight
      const context = canvas.getContext("2d")!

      function loop() {
        if (!mounted.current) return

        context.drawImage(video.current!, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)

        let result: DecoderResult | null = null

        try {
          result = new Decoder().decode(image.data, canvas.width, canvas.height)
        } catch (e: unknown) { }

        if (result != null)
          setText(result.data)
        requestAnimationFrame(loop)
      }

      requestAnimationFrame(loop)
    })

    video.current.srcObject = stream
    video.current.play()
  }, [])

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 1080 },
        height: { min: 1080 },
        facingMode: { exact: "environment" }
      }
    }).then(onStream)
  }, [onStream])

  useEffect(() => {
    if (text) alert(text)
  }, [text])

  return <>
    <video className="grow w-full object-cover"
      ref={video}
      playsInline
      muted />
  </>
}