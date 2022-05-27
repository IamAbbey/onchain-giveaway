# On-chain Decentralized GiveAway Application

Decentralized GiveAway Application is an easy to use Verifiable Randomness Giveaway system utilizing state of the art smart contract automation services - ChainLink VRF, ChainLink Keepers.

## ChainLink VRF

Chainlink VRF (Verifiable Random Function) is a provably fair and verifiable random number generator (RNG) that enables smart contracts to access random values without compromising security or usability.
For each selection winners by our application, Chainlink VRF generates one or more random values and cryptographic proof of how those values were determined. The proof is published and verified on-chain before any consuming applications can use it. This process ensures that results cannot be tampered with or manipulated by any single entity including oracle operators, miners, users, or smart contract developers.

## ChainLink Keepers

This system's smart contracts is automated using ChainLink Keepers, the decentralized and highly reliable smart contract automation service. Relying on ChainLink Keepers helps get to market faster and save gas by offloading expensive on-chain automation logic to ChainLin's decentralized Keepers Network.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

### MVP test coverage: 100%

- Run the tests with coverage:

```sh
$ coverage run -m pytest
$ coverage html
$ open htmlcov/index.html
```

Easily Integrate Verifiable Randomness Giveaway system (ChainLink VRF, ChainLink external adapter)
Start time and end time can be configured
Configure how many individuals you want to give away to
Ensures that no user receives twice

1. As a givers I want to be able to

   1. Choose which token I want to give
   2. Deposit the selected token
   3. Record added time
   4. Set start time (can be in the future) and end time
   5. Maximum number of winners

2. As an entrant I want to be able to
   1. Select sweepstake
   2. See sweepstake details
   3. Apply if its still active
   4. Can only apply if its still active (within active duration)
