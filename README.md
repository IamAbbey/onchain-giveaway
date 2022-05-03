# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

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

Easily Integrate Verifiable Randomness Giveaway system (ChainLink VRF, ChainLink external adapter)
Start time and end time can be configured
Configure how many individuals you want to give away to
Ensures that no user receives twice

1. As a givers I want to be able to

   1. Choose which token I want to give
   2. Get to see the value in USD
   3. Deposit the selected token
   4. Record added time
   5. Set start time (can be in the future) and end time
   6. Maximum winner count

2. As a receiver I want to be able to
   1. Select sweepstake
   2. See sweepstake details
   3. Apply if its still active
   4. Can only apply if its still active (within active duration)
