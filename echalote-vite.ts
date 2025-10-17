// Import Buffer polyfill for browser compatibility
import { Buffer } from 'buffer'

// Make Buffer globally available
declare global {
  interface Window {
    Buffer: typeof Buffer
    startExample: () => Promise<void>
    clearOutput: () => void
  }
}

window.Buffer = Buffer

// Import the actual Echalote libraries
import { TorClientDuplex, Echalote, createSnowflakeStream, Circuit } from "@hazae41/echalote"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { fetch } from "@hazae41/fleche"

// Import the WebSocketDuplex from the wallet's implementation
import { WebSocketDuplex } from './src/libs/streams/websocket.js'

import * as walletWasm from '@brumewallet/wallet.wasm'

// import * as aesWasm from '@hazae41/aes.wasm'
// import * as base16Wasm from '@hazae41/base16.wasm'
// import * as base58Wasm from '@hazae41/base58.wasm'
// import * as base64Wasm from '@hazae41/base64.wasm'
// import * as bitwiseWasm from '@hazae41/bitwise.wasm'
// import * as chacha20poly1305Wasm from '@hazae41/chacha20poly1305.wasm'
// import * as ed25519Wasm from '@hazae41/ed25519.wasm'
// import * as memoryWasm from '@hazae41/memory.wasm'
// import * as networkWasm from '@hazae41/network.wasm'
// import * as ripemdWasm from '@hazae41/ripemd.wasm'
// import * as rsaWasm from '@hazae41/rsa.wasm'
// import * as secp256k1Wasm from '@hazae41/secp256k1.wasm'
// import * as sha1Wasm from '@hazae41/sha1.wasm'
// import * as sha3Wasm from '@hazae41/sha3.wasm'
// import * as x25519Wasm from '@hazae41/x25519.wasm'

type LogType = 'info' | 'success' | 'error'

let isRunning: boolean = false

function log(message: string, type: LogType = 'info'): void {
  const output = document.getElementById('output')
  if (!output) return

  const timestamp = new Date().toLocaleTimeString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  output.textContent += `[${timestamp}] ${prefix} ${message}\n`
  output.scrollTop = output.scrollHeight
  console.log(`[${timestamp}] ${message}`)
}

function clearOutput(): void {
  const output = document.getElementById('output')
  if (output) {
    output.textContent = ''
  }
}

// async function initAllWasm() {
//   await Promise.all([
//     aesWasm.initBundled(),
//     base16Wasm.initBundled(),
//     base58Wasm.initBundled(),
//     base64Wasm.initBundled(),
//     bitwiseWasm.initBundled(),
//     chacha20poly1305Wasm.initBundled(),
//     ed25519Wasm.initBundled(),
//     memoryWasm.initBundled(),
//     networkWasm.initBundled(),
//     ripemdWasm.initBundled(),
//     rsaWasm.initBundled(),
//     secp256k1Wasm.initBundled(),
//     sha1Wasm.initBundled(),
//     sha3Wasm.initBundled(),
//     x25519Wasm.initBundled(),
//   ]);
// }

async function waitForWebSocket(
  socket: WebSocket,
  signal: AbortSignal = new AbortController().signal
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onOpen = (): void => {
      cleanup()
      resolve()
    }
    const onError = (e: Event): void => {
      cleanup()
      reject(e)
    }
    const onClose = (e: CloseEvent): void => {
      cleanup()
      reject(e)
    }
    const onAbort = (): void => {
      cleanup()
      reject(new Error("Aborted"))
    }

    const cleanup = (): void => {
      socket.removeEventListener("open", onOpen)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
    }

    socket.addEventListener("open", onOpen, { passive: true })
    socket.addEventListener("close", onClose, { passive: true })
    socket.addEventListener("error", onError, { passive: true })
    signal.addEventListener("abort", onAbort, { passive: true })
  })
}

async function startExample(): Promise<void> {
  if (isRunning) return

  isRunning = true
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  if (startBtn) {
    startBtn.disabled = true
  }

  try {
    log("🚀 Starting REAL Echalote example with Vite...")

    log('init wasm')
    // await initAllWasm();
    await walletWasm.initBundled();
    log('wasm initialized')

    log("📚 Libraries imported successfully!")

    // Test basic WebSocket connectivity first
    log("🔌 Testing basic WebSocket connectivity...")
    const testSocket = new WebSocket("wss://echo.websocket.org/")
    testSocket.binaryType = "arraybuffer"

    try {
      await waitForWebSocket(testSocket, AbortSignal.timeout(5000))
      log("✅ Basic WebSocket connectivity works", 'success')
      testSocket.close()
    } catch (error) {
      log(`❌ Basic WebSocket test failed: ${(error as Error).message}`, 'error')
      return
    }

    log("🌨️ Connecting to Snowflake bridge...")

    // Create WebSocket connection to Snowflake bridge
    const socket = new WebSocket("wss://snowflake.torproject.net/")
    socket.binaryType = "arraybuffer"

    // Wait for WebSocket to open with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      await waitForWebSocket(socket, controller.signal)
      clearTimeout(timeoutId)
      log("✅ Connected to Snowflake bridge!", 'success')

      // Add WebSocket debugging
      socket.addEventListener('message', (event: MessageEvent) => {
        const size = event.data.byteLength || event.data.length
        log(`📨 WebSocket received ${size} bytes`)
      })

      socket.addEventListener('error', (error: Event) => {
        log(`🔴 WebSocket error: ${error}`, 'error')
      })

      socket.addEventListener('close', (event: CloseEvent) => {
        log(`🔴 WebSocket closed: code=${event.code}, reason=${event.reason}`, 'error')
      })

    } catch (error) {
      clearTimeout(timeoutId)
      log(`❌ Failed to connect to Snowflake bridge: ${(error as Error).message}`, 'error')
      return
    }

    // Create duplex stream from WebSocket
    log("🔧 Creating WebSocketDuplex wrapper...")
    const stream = new WebSocketDuplex(socket, { shouldCloseOnError: true, shouldCloseOnClose: true })

    // Create Snowflake stream and Tor client
    log("🌨️ Creating Snowflake stream...")
    const tcp = createSnowflakeStream(stream)
    const tor = new TorClientDuplex()

    // Connect streams with better error handling
    log("🔗 Connecting streams...")

    tcp.outer.readable.pipeTo(tor.inner.writable).catch((error: Error) => {
      log(`⚠️ TCP -> Tor stream error: ${error.message}`, 'error')
    })

    tor.inner.readable.pipeTo(tcp.outer.writable).catch((error: Error) => {
      log(`⚠️ Tor -> TCP stream error: ${error.message}`, 'error')
    })

    // Add event listeners for debugging
    tor.events.on("error", (error: unknown) => {
      log(`🔴 Tor client error: ${error}`, 'error')
    })

    tor.events.on("close", (reason: unknown) => {
      log(`🔴 Tor client closed: ${reason}`, 'error')
    })

    // Wait for Tor to be ready with more detailed logging
    log("⏳ Waiting for Tor to be ready (this may take 30+ seconds)...")
    log("📝 This step performs the Tor handshake with the Snowflake bridge...")

    try {
      await tor.waitOrThrow(AbortSignal.timeout(90000)) // Increased to 90 seconds
      log("✅ Tor client ready!", 'success')
    } catch (error) {
      log(`❌ Tor handshake failed: ${(error as Error).message}`, 'error')
      log(`🔍 This could indicate:`, 'error')
      log(`   • Snowflake bridge connection issues`, 'error')
      log(`   • Tor protocol handshake problems`, 'error')
      log(`   • Network interference or timeouts`, 'error')
      throw error
    }

    // Create circuit
    log("🔗 Creating circuit...")
    const circuit: Circuit = await tor.createOrThrow()
    log("✅ Circuit created!", 'success')

    // Fetch consensus
    log("📋 Fetching consensus...")
    const consensus = await Echalote.Consensus.fetchOrThrow(circuit)
    log(`✅ Consensus fetched with ${consensus.microdescs.length} microdescs!`, 'success')

    // Filter relays
    log("🔍 Filtering relays...")
    const middles = consensus.microdescs.filter((it: any) => true
      && it.flags.includes("Fast")
      && it.flags.includes("Stable")
      && it.flags.includes("V2Dir"))

    const exits = consensus.microdescs.filter((it: any) => true
      && it.flags.includes("Fast")
      && it.flags.includes("Stable")
      && it.flags.includes("Exit")
      && !it.flags.includes("BadExit"))

    log(`📊 Found ${middles.length} middle relays and ${exits.length} exit relays`)

    if (middles.length === 0 || exits.length === 0) {
      log("❌ Not enough suitable relays found", 'error')
      return
    }

    // Select middle relay and extend circuit
    log("🔀 Extending circuit through middle relay...")
    const middle = middles[Math.floor(Math.random() * middles.length)]
    const middle2 = await Echalote.Consensus.Microdesc.fetchOrThrow(circuit, middle)
    await circuit.extendOrThrow(middle2, AbortSignal.timeout(10000))
    log("✅ Extended through middle relay!", 'success')

    // Select exit relay and extend circuit
    log("🚪 Extending circuit through exit relay...")
    const exit = exits[Math.floor(Math.random() * exits.length)]
    const exit2 = await Echalote.Consensus.Microdesc.fetchOrThrow(circuit, exit)
    await circuit.extendOrThrow(exit2, AbortSignal.timeout(10000))
    log("✅ Extended through exit relay!", 'success')

    // Open TCP connection through Tor
    log("🌐 Opening connection to target...")
    const ttcp = await circuit.openOrThrow("httpbin.org", 443)

    // Create TLS connection
    log("🔒 Setting up TLS connection...")
    const ciphers = [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384, Ciphers.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384]
    const ttls = new TlsClientDuplex({ host_name: "httpbin.org", ciphers })

    // Connect TLS streams
    ttcp.outer.readable.pipeTo(ttls.inner.writable).catch(() => { })
    ttls.inner.readable.pipeTo(ttcp.outer.writable).catch(() => { })

    log("📡 Making HTTPS request through Tor...")
    // Make HTTPS request through Tor
    const response = await fetch("https://httpbin.org/ip", { stream: ttls.outer })
    const data = await response.json()

    log(`🎉 SUCCESS! Response from httpbin.org/ip:`, 'success')
    log(`📍 Your IP through Tor: ${data.origin}`, 'success')
    log("✅ Full Echalote example completed successfully!", 'success')

    // Clean up
    circuit[Symbol.dispose]()

  } catch (error) {
    log(`❌ Example failed: ${(error as Error).message}`, 'error')
    log(`Stack trace: ${(error as Error).stack}`, 'error')
  } finally {
    isRunning = false
    if (startBtn) {
      startBtn.disabled = false
    }
  }
}

// Make functions globally available
window.startExample = startExample
window.clearOutput = clearOutput

// Initial log
log("🌐 Vite browser environment ready")
log("📦 Echalote libraries loaded successfully")
log("👆 Click 'Start Full Echalote Example' to begin the real test!")