### Supply-chain hardened

We try our best to avoid supply-chain attacks from external packages

- We use browser APIs when available
- All WebAssembly packages are reproducible and try to use audited dependencies
- We count each individual maintainer in our dependency graph as a risk
- We use runtime protection techniques such as object-capability model
- We upload each release on IPFS and (soon) publish the hash on Ethereum