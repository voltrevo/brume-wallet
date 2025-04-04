# Brume Wallet

The private Ethereum wallet with built-in Tor

## [About](/docs/README.md)

## Usage

You can use Brume Wallet on a website, as a browser extension, and as a mobile application

### Website (official)

- [Go to wallet.brume.money](https://wallet.brume.money)

### Website (ipfs)

- [Go to latest version](https://github.com/brumeproject/wallet/blob/main/dist/.website.ipfs.md)

### Chrome-like extension (official store)

- [Chrome Store](https://chrome.google.com/webstore/detail/brume-wallet/oljgnlammonjehmmfahdjgjhjclpockd)

### Firefox-like extension (official store)

- [Firefox Store](https://addons.mozilla.org/firefox/addon/brumewallet/)

### Safari extension on iOS and macOS (official store)

- [Apple TestFlight](https://testflight.apple.com/join/WtNNiY98)

### Android application (signed .apk)

- [Download .apk](https://github.com/brumeproject/wallet/raw/main/dist/android.apk)

### Android application (alternative store)

- [F-Droid](https://f-droid.org/packages/money.brume.wallet/)

### Safari extension on macOS only (signed .app)

- [Download .zip](https://github.com/brumeproject/wallet/raw/main/dist/macos.zip)

### Safari extension on iOS only (alternative store)

- Copy the link to the [AltStore](https://altstore.io) source

`https://raw.githubusercontent.com/brumeproject/wallet/main/altstore.json`

### Safari extension on iOS only (signed .ipa)

- [Download .ipa](https://github.com/brumeproject/wallet/raw/main/dist/ios-and-ipados.ipa)

### Website (reproducible cloud-hosting)

- Clone the repository on your GitHub account
- Host it on a cloud provider with `npm run build:vercel` as build command and `out` as build output

### Website (reproducible self-hosting)

- [Download .zip](https://github.com/brumeproject/wallet/raw/main/dist/website.zip)
- Extract `website.zip` in a new folder
- Serve using `npx serve`

### Chrome-like extension (reproducible self-installation)

- [Download .zip](https://github.com/brumeproject/wallet/raw/main/dist/chrome.zip)
- Extract `chrome.zip` in a new folder
- Open Chrome, open settings, left panel, bottom, click `Extensions`
- Top bar, right, enable `Developer mode`
- Click `Load unpacked`, select the folder where `chrome.zip` was extracted

### Firefox-like extension (reproducible temporary self-installation)

- [Download .zip](https://github.com/brumeproject/wallet/raw/main/dist/firefox.zip)
- Extract `firefox.zip` in a new folder
- Open Firefox, navigate to `about:debugging`
- Left panel, click `This Firefox`
- `Temporary Extensions`, click `Load Temporary Add-on`
- Navigate to the Brume Wallet folder
- Open the folder where `firefox.zip` was extracted
- Select the `manifest.json` file

### [All builds (ipfs)](https://github.com/brumeproject/wallet/blob/main/dist/.ipfs.md)

## Reproducible building

### Installing and building

- Install node v20.3.1 (npm v9.6.7)

- Clone the repository

```bash
git clone https://github.com/brumeproject/wallet && cd wallet
```

- Build the website and extension

```bash
npm install && npm run build && npm run zip
```

- Website and extension files are in the `dist` folder

### Comparing released files with built files

GitHub Actions automatically rebuilds each release and checks that the committed files are the same as the built ones

https://github.com/brumeproject/wallet/actions/workflows/release.yml

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
