# Brume Wallet ☁️

A non-custodial and private Ethereum wallet with a built-in integration of Tor

### Experimental ⚠️

This is experimental software in early development

1. It has security issues
2. Things change quickly

Use at your own risk

### TLDR
- Anonymous requests using Tor, no installation needed, each wallet address has its own IP address
- Built for strong privacy and supply-chain hardened
- Available as an extension and on a website
- Better UX and features than your average wallet
- Made by french cypherpunks

### I don't understand that Tor thing

Brume Wallet sends your transactions through the Tor network (the dark web), so people at the end of the pipe can't use your IP address to: 
- Know your location and ISP
- Track you and link your multiple identities together
- Send your IP address to people you don't like

MetaMask and similar wallets send your IP address and your wallet address to third-parties (RPC, Coingecko, Etherscan)

They can track you even if you are using on-chain privacy tools such as Aztec Network or Tornado Cash

<img width="762" src="https://user-images.githubusercontent.com/111573119/201625137-293eec93-a6c9-43fd-8eda-56dea0c8e00e.png">

### How to check IP address leaks?

- Add our proxy to your MetaMask networks

Network name: `Brume Proxy`

New RPC URL: `https://proxy.haz.workers.dev`

Chain ID: `1`

Currency Symbol: `ETH`

- Go on the logs website https://logs.brume.money/

### Getting started

You can use Brume Wallet as an extension and on a website

#### Using the website

- Click here https://wallet.brume.money

#### Using the extension

- Clone

```bash
git clone https://github.com/brume-wallet/brume-wallet && cd brume-wallet
```

- Build

```bash
npm i && npm run build:extension
```

- Open Chrome, open settings
- Left panel, bottom, click `Extensions`
- Top bar, right, enable `Developer mode`
- Click `Load unpacked`
- Navigate to the Brume Wallet folder
- Select the `chrome` folder

## Next

We plan to further develop Brume Wallet by adding several features necessary for everyday use, such as the integration of on-chain privacy tools (Aztec Network), supporting other blockchains (EVM & Non-EVM) and adding useful features such as a token approval manager

<img width="966" src="https://user-images.githubusercontent.com/111573119/201625406-58c1b481-ce27-47e0-a430-734d03b21fc6.png">
