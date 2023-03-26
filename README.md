# Brume Wallet

## DO NOT USE

This is experimental software in early development

1. It has security issues
2. Things change quickly

## What

Brume Wallet is the first non-custodial **privacy wallet** created on the Ethereum blockchain, allowing to **guarantee the anonymity of its user** thanks to a **built-in TOR integration**. This integration enables user's personal information, such as **IP addresses** to be completely isolated from stakeholders with whom the wallet directly communicates (RPCs, Etherscan, Coingecko...).

This is the first wallet enabling that, as other wallets claiming privacy are using this word for marketing purposes mainly, such as BlockWallet which has access to its users' IPs through the use of their own servers as a proxy.
Wasabi and Samourai allow you to have an offchain privacy, using TOR, but you have to manually install TOR Network and run a node in order to profit from this.
With Brume Wallet, no need to install TOR, just install Brume extension, et voilà.

### Metamask and other wallets

Your IP is leaked with your wallet address. Both Metamask servers and third parties servers (RPCs, Etherscan, Coingecko..) can then use it to link all of your wallet address together, which can then be used to track you, even if you are using on-chain privacy tools such as Aztec Network or Tornado Cash.

### Brume Wallet

You don't have to trust our wallet, the third parties just can't see your IP address, as they only receive the TOR's IP address.

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

## How to see that MetaMask is leaking IP address?

1. Add our proxy to your MetaMask networks

Network name: `Brume Proxy`

New RPC URL: `https://proxy.haz.workers.dev`

Chain ID: `1`

2. Go on the logs website https://logs.brume.money/

## Next

We plan to further develop Brume Wallet by adding several features necessary for everyday use, such as the integration of on-chain privacy tools (Aztec Network), supporting other blockchains (EVM & Non-EVM) and adding a token approval manager.

Here is what Brume Wallet features would look like:

<img width="966" alt="Screenshot 2022-11-12 at 12 00 57" src="https://user-images.githubusercontent.com/111573119/201625406-58c1b481-ce27-47e0-a430-734d03b21fc6.png">
