# Brume Wallet

Brume Wallet is a non-custodial and private Ethereum wallet with a built-in integration of Tor

## Experimental

This is experimental software in early development

1. It has security issues
2. Things change quickly

Use at your own risk

## TLDR
- Anonymous requests using Tor, no installation needed, each wallet address has its own IP address
- Built for strong privacy and supply-chain hardened
- Available as an extension and on a website
- Better UX and features than your average wallet

### I don't understand that Tor thing

When using Metamask, your IP address and your wallet address is sent to third-parties (RPC, Coingecko, Etherscan), even if you are using on-chain privacy tools such as Aztec Network or Tornado Cash

Brume Wallet sends your transactions through the Tor network (the dark web), so people at the end of the pipe can't use your IP address to: 
- Know your location and ISP
- Link your multiple identities together
- Send your IP address to people you don't like

<img width="762" src="https://user-images.githubusercontent.com/111573119/201625137-293eec93-a6c9-43fd-8eda-56dea0c8e00e.png">

## Installation

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

## Usage

- Launch the extension, click on `Create wallet`.
- Enter a name for your wallet click on `Add`.
- Click on your wallet, copy your wallet address, fund your wallet with Goerli by clicking on the $ icon.
- Add a recipient, a value and send some Goerli to a lucky guy.

Congrats, you just used the first private Ethereum wallet 🎉🥳🍾

## How to check that MetaMask is leaking your IP address?

1. Add our proxy to your MetaMask networks

Network name: `Brume Proxy`

New RPC URL: `https://proxy.haz.workers.dev`

Chain ID: `1`

Currency Symbol: `ETH`

2. Go on the logs website https://logs.brume.money/

## Next

We plan to further develop Brume Wallet by adding several features necessary for everyday use, such as the integration of on-chain privacy tools (Aztec Network), supporting other blockchains (EVM & Non-EVM) and adding useful features such as a token approval manager

<img width="966" alt="Screenshot 2022-11-12 at 12 00 57" src="https://user-images.githubusercontent.com/111573119/201625406-58c1b481-ce27-47e0-a430-734d03b21fc6.png">
