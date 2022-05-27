# On-chain Decentralized GiveAway Application

Decentralized GiveAway Application is an easy to use Verifiable Randomness Giveaway system utilizing state of the art smart contract automation services - ChainLink VRF, ChainLink Keepers.

## ChainLink VRF

Chainlink VRF (Verifiable Random Function) is a provably fair and verifiable random number generator (RNG) that enables smart contracts to access random values without compromising security or usability.
For each selection winners by our application, Chainlink VRF generates one or more random values and cryptographic proof of how those values were determined. The proof is published and verified on-chain before any consuming applications can use it. This process ensures that results cannot be tampered with or manipulated by any single entity including oracle operators, miners, users, or smart contract developers.

## ChainLink Keepers

This system's smart contracts is automated using ChainLink Keepers, the decentralized and highly reliable smart contract automation service. Relying on ChainLink Keepers helps get to market faster and save gas by offloading expensive on-chain automation logic to ChainLin's decentralized Keepers Network.

## Testing

```
npx hardhat test
```

### Test Coverage

```
npx hardhat coverage
```

## Local Development

1. Start localhost node

```
npx hardhat node --network hardhat
```

2.  Start frontend server

```
$ cd frontend
$ npm install
$ npm run dev
```

3. Add hardhat network to your metamask/wallet
   - Get the RPC_URL of your hardhat node (usually `http://127.0.0.1:8545/`)
   - Go to your wallet and add a new network. [See instructions here.](https://metamask.zendesk.com/hc/en-us/articles/360043227612-How-to-add-a-custom-network-RPC)
     - Network Name: Hardhat-Localhost
     - New RPC URL: http://127.0.0.1:8545/
     - Chain ID: 31337
     - Currency Symbol: ETH (or GO)
     - Block Explorer URL: None

## Deployment to a testnet or mainnet

1. Setup environment variabltes

You'll want to set your `RINKEBY_RPC_URL` and `PRIVATE_KEY` as environment variables. You can add them to a `.env` file, similar to what you see in `.env.example`.

- `PRIVATE_KEY`: The private key of your account (like from [metamask](https://metamask.io/)). **NOTE:** FOR DEVELOPMENT, PLEASE USE A KEY THAT DOESN'T HAVE ANY REAL FUNDS ASSOCIATED WITH IT.
  - You can [learn how to export it here](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key).
- `RINKEBY_RPC_URL`: This is url of the rinkeby testnet node you're working with. You can get setup with one for free from [Alchemy](https://alchemy.com/?a=673c802981)

2. Get testnet ETH

Head over to [faucets.chain.link](https://faucets.chain.link/) and get some tesnet ETH & LINK. You should see the ETH and LINK show up in your metamask. [You can read more on setting up your wallet with LINK.](https://docs.chain.link/docs/deploy-your-first-contract/#install-and-fund-your-metamask-wallet)

3. Setup a Chainlink VRF Subscription ID

Head over to [vrf.chain.link](https://vrf.chain.link/) and setup a new subscription, and get a subscriptionId. You can reuse an old subscription if you already have one.

[You can follow the instructions](https://docs.chain.link/docs/get-a-random-number/) if you get lost. You should leave this step with:

1. A subscription ID
2. Your subscription should be funded with LINK

3. Deploy

In your `helper-hardhat-config.js` add your `subscriptionId` under the section of the chainId you're using (aka, if you're deploying to rinkeby, add your `subscriptionId` in the `subscriptionId` field under the `4` section.)

Then run:

```
npx hardhat deploy --network rinkeby --tags all
```

And copy / remember the contract address.

4. Add your contract address as a Chainlink VRF Consumer

Go back to [vrf.chain.link](https://vrf.chain.link) and under your subscription add `Add consumer` and add your contract address. You should also fund the contract with a minimum of 1 LINK.

5. Register a Chainlink Keepers Upkeep

[You can follow the documentation if you get lost.](https://docs.chain.link/docs/chainlink-keepers/compatible-contracts/)

Go to [keepers.chain.link](https://keepers.chain.link/new) and register a new upkeep. Your UI will look something like this once completed:

![Keepers](./img/keepers.png)

## Verify on etherscan

If you deploy to a testnet or mainnet, you can verify it if you get an [API Key](https://etherscan.io/myapikey) from Etherscan and set it as an environemnt variable named `ETHERSCAN_API_KEY`. You can pop it into your `.env` file as seen in the `.env.example`.

In it's current state, if you have your api key set, it will auto verify kovan contracts!
