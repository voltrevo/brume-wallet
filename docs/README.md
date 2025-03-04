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