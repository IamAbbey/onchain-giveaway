/* eslint-env jest */

const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const dayjs = require("dayjs");
const { expect: chai_expect, assert } = require("chai");
const { currentBlockTimeStamp } = require("../../utils/testing-helper");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

// const VALID_TOKEN = "0xa36085F69e2889c224210F603D836748e7dC0088";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// !developmentChains.includes(network.name)
//   ? describe.skip
//   : describe("managing allowed token", () => {
//       it("should allow adding of token", async () => {
//         const [owner, addr1] = await ethers.getSigners();
//         const SweepStake = await ethers.getContractFactory("SweepStake");

//         const sweepStake = await SweepStake.deploy();
//         await sweepStake.addAllowedTokens(VALID_TOKEN);

//         assert.equal(await sweepStake.getAllowedTokens(0), VALID_TOKEN);

//         await chai_expect(
//           sweepStake.connect(addr1).addAllowedTokens(VALID_TOKEN)
//         ).to.be.revertedWith("Ownable: caller is not the owner");
//       });
//     });

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("managing allowed token", () => {
      let sweepStake, linkAddress, linkToken, sweepStakeContract, deployer;
      it("should allow adding of token", async () => {
        // deployer = (await getNamedAccounts()).deployer
        const accounts = await ethers.getSigners();
        addr1 = accounts[1];
        await deployments.fixture(["mocks", "sweepStake"]);

        sweepStake = await ethers.getContract("SweepStake");
        linkToken = await ethers.getContract("LinkToken");
        linkAddress = linkToken.address;

        // const sweepStake = await SweepStake.deploy();
        await sweepStake.addAllowedTokens(linkAddress);

        assert.equal(await sweepStake.getAllowedTokens(0), linkAddress);

        await chai_expect(
          sweepStake.connect(addr1).addAllowedTokens(linkAddress)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
