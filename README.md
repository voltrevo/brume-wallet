# Brume Wallet

The private Ethereum wallet with built-in Tor

### TLDR
- Anonymous requests using Tor (the dark net)
- Built for strong zero-cost privacy and security
- Available as an extension and on a website

### About 

Brume Wallet is an **Ethereum wallet** (for now), whose killer feature is a built-in implementation of the Tor protocol (the dark net), that makes **all your network requests go through the Tor network**, such that the people at the end of the pipe **can't use your IP address to track you or censor you**.

By using traditional wallets, your IP address is sent to multiple third-party services, who often have access to your multiple wallet addresses too, so they can use this information to track you and your wallets, and/or censor your transactions.

Brume Wallet prevents that, and does even more in terms of privacy and security.

This project was launched by Le Hash at the privacy-centric EthBrno hackathon, 2022 edition. It won first place and the design award. It is supported and developed by cypherpunks who have a strong background in privacy and security.

Le Hash is a software engineer and pentester with an impressive GitHub profile, he found high and critical security vulnerabilities in protocols such as Tor, WalletConnect, TornadoCash, and in companies such as FleekHQ.

We believe privacy and security are the foundations of the crypto ecosystem, and that this should remain true, especially for the Ethereum ecosystem. The story is that we used multiple wallets and never found the right shoe in terms of privacy and security, so **we decided to make our own**.

This project allows us to make privacy and security important again, with a scheme we like to call "**zero-cost privacy**", that is, privacy with almost no cost for the user in terms of UX and features.

We already almost achieved **feature-parity with existing wallets** such as MetaMask, but with the added privacy and security.

For example, we fixed the privacy and security of Ledger and WalletConnect by making our own implementation of these protocols for our wallet, such that there is **no privacy leak possible and no security backdoor**.

All our work is **fully open-source**, MIT licensed, and reproducible. And we will soon provide a best-effort distribution system by publishing the hashes of the builds to IPFS and Ethereum.

### I don't understand that Tor thing

Brume Wallet sends your transactions through the Tor network (the dark web), so people at the end of the pipe can't use your IP address to: 
- Know your location and ISP
- Track you and link your multiple identities together
- Send your IP address to people you don't like

Traditional wallets send your IP address and your wallet address to third-parties (RPC, Coingecko, Etherscan).

They can track you even if you are using on-chain privacy tools such as mixers and private blockchains.

## Usage

You can use Brume Wallet on a website, as a browser extension, and as a mobile application

### Website (official)

- [Go to wallet.brume.money](https://wallet.brume.money)

### Website (ipfs)

- [Go to latest version](https://github.com/brumewallet/wallet/blob/main/dist/.website.ipfs.md)

### Chrome-like extension (official store)

- [Chrome Store](https://chrome.google.com/webstore/detail/brume-wallet/oljgnlammonjehmmfahdjgjhjclpockd)

### Firefox-like extension (official store)

- [Firefox Store](https://addons.mozilla.org/firefox/addon/brumewallet/)

### Safari extension on iOS and macOS (official store)

- [Apple TestFlight](https://testflight.apple.com/join/WtNNiY98)

### Android application (signed .apk)

- [Download .apk](https://github.com/brumewallet/wallet/raw/main/dist/android.apk)

### Android application (alternative store)

- [F-Droid](https://f-droid.org/packages/eth.brume.wallet/)

### Safari extension on macOS only (signed .app)

- [Download .zip](https://github.com/brumewallet/wallet/raw/main/dist/macos.zip)

### Safari extension on iOS only (alternative store)

- Copy the link to the [AltStore](https://altstore.io) source

`https://raw.githubusercontent.com/brumewallet/wallet/main/altstore.json`

### Safari extension on iOS only (signed .ipa)

- [Download .ipa](https://github.com/brumewallet/wallet/raw/main/dist/ios-and-ipados.ipa)

### Website (reproducible cloud-hosting)

- Clone the repository on your GitHub account
- Host it on a cloud provider with `npm run build:vercel` as build command and `out` as build output

### Website (reproducible self-hosting)

- [Download .zip](https://github.com/brumewallet/wallet/raw/main/dist/website.zip)
- Extract `website.zip` in a new folder
- Serve using `npx serve`

### Chrome-like extension (reproducible self-installation)

- [Download .zip](https://github.com/brumewallet/wallet/raw/main/dist/chrome.zip)
- Extract `chrome.zip` in a new folder
- Open Chrome, open settings, left panel, bottom, click `Extensions`
- Top bar, right, enable `Developer mode`
- Click `Load unpacked`, select the folder where `chrome.zip` was extracted

### Firefox-like extension (reproducible temporary self-installation)

- [Download .zip](https://github.com/brumewallet/wallet/raw/main/dist/firefox.zip)
- Extract `firefox.zip` in a new folder
- Open Firefox, navigate to `about:debugging`
- Left panel, click `This Firefox`
- `Temporary Extensions`, click `Load Temporary Add-on`
- Navigate to the Brume Wallet folder
- Open the folder where `firefox.zip` was extracted
- Select the `manifest.json` file

### [All builds (ipfs)](https://github.com/brumewallet/wallet/blob/main/dist/.ipfs.md)

## Reproducible building

### Installing and building

- Install node v20.3.1 (npm v9.6.7)

- Clone the repository

```bash
git clone https://github.com/brumewallet/wallet && cd wallet
```

- Build the website and extension

```bash
npm install && npm run build && npm run zip
```

- Website and extension files are in the `dist` folder

### Comparing released files with built files

GitHub Actions automatically rebuilds each release and checks that the committed files are the same as the built ones

https://github.com/brumewallet/wallet/actions/workflows/release.yml

You can check the comparison yourself by running the following

```bash
# Create ./tmp
mkdir ./tmp

# Unzip committed zip files into ./tmp
unzip ./dist/chrome.zip -d ./tmp/chrome
unzip ./dist/firefox.zip -d ./tmp/firefox
unzip ./dist/website.zip -d ./tmp/website

# Rebuild
npm ci && npm run build

# Compare unzipped content
diff -r ./tmp/chrome ./dist/chrome
diff -r ./tmp/firefox ./dist/firefox
diff -r ./tmp/website ./dist/website

# Delete ./tmp
rm -rf ./tmp

# Restore build files
git restore ./dist/

# Recompute IPFS hashes
node ./scripts/verify.ipfs.mjs

# Display IPFS hashes
cat ./dist/.ipfs.md
cat ./dist/.website.ipfs.md

# Compare all files
[[ -z $(git status --porcelain) ]] && echo "OK" || echo "NOT OK"
```

## Security design

### Encrypted storage

Your storage is hashed and encrypted using strong cryptography algorithms and parameters

- Cryptography algorithms are seeded by PBKDF2 with 1M+ iterations from your password
- All storage keys are hashed using HMAC-SHA256, it is impossible to retrieve the original key
- All storage values are encrypted using AES-256-GCM, each with a different ciphertext/IV

### Authenticated storage

Some critical entities like private keys and seed phrases are stored in WebAuthn and require authentication (FaceID/TouchID)

- They are encrypted before being stored in WebAuthn storage
- Their reference ID and encryption IV are stored in encrypted storage (the one we talked above)

Nobody can access your private keys or seed phrases without your password + authentication (FaceID/TouchID)

This mitigates supply-chain attacks and phishing attacks, and prevents phone-left-on-the-table attacks

### Supply-chain hardened

We try our best to avoid supply-chain attacks from external packages

- We use browser APIs when available
- All WebAssembly packages are reproducible and try to use audited dependencies
- We count each individual maintainer in our dependency graph as a risk
- We use runtime protection techniques such as object-capability model
- We upload each release on IPFS and (soon) publish the hash on Ethereum

### Safe Tor and TLS protocols

We use the Tor and the TLS protocols in a way that's mostly safe, even though they are not fully implemented nor audited

Keep in mind that the zero risk doesn't exist, and a highly motivated attacker could deanonymize you by doing the following steps (very unlikely to happen):

1. Owning the entry node, and logging all IP addresses using Brume Wallet, something he could know by:
  - Deep packet inspection, since our Tor/TLS packets may not be like those from regular Tor/TLS users
  - Behaviour analysis, since our Tor/TLS may not behave the same way as regular Tor/TLS implementations

2. Owning the JSON-RPC server, and logging all wallet addresses that used Tor

3. Correlating IP addresses logs with wallet addresses logs, and if both sides are small enough, linking a particular IP address to a particular wallet address
