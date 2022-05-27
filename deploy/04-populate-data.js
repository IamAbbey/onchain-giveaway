// const {
//   frontEndContractsFile,
//   frontEndAbiFile,
// } = require("../helper-hardhat-config");
// const fs = require("fs");
// const { network, deployments, ethers } = require("hardhat");
// const dayjs = require("dayjs");
// const { expect: chai_expect, assert } = require("chai");

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END || true) {
    console.log("populating data...");
    // await populateData();
    // await createSweepStake();
    // await createSweepStake();
    console.log("Done!");
  }
};

// async function populateData() {
//   await deployments.fixture(["mocks", "sweepStake", "SSToken"]);
//   const sweepStake = await ethers.getContract("SweepStake");
//   const customToken = await ethers.getContract("SSToken");
//   const customTokenAddress = customToken.address;

//   const accounts = await ethers.getSigners();
//   owner = accounts[0];

//   await sweepStake.connect(owner).addAllowedTokens(customTokenAddress);

//   console.log(owner.address);

//   const tokenToGive = await sweepStake.getAllowedTokens(0);

//   console.log(tokenToGive);

//   await customToken
//     .connect(owner)
//     .approve(sweepStake.address, ethers.utils.parseUnits("10000"));

//   start_time = dayjs().add(5, "minute").unix();
//   end_time = dayjs().add(15, "days").unix();
//   console.log("sweepStake Address", sweepStake.address);
//   //   await chai_expect(
//   await sweepStake
//     .connect(owner)
//     .createSweepStake(
//       3,
//       start_time,
//       end_time,
//       ethers.utils.parseUnits("1000"),
//       "Christmas cheerful giving",
//       tokenToGive
//     );

//   console.log(await sweepStake.allSweepStakes());
//   //   ).to.emit(sweepStake, "NewSweepStakeAdded");
// }

// async function createSweepStake() {
//   start_time = dayjs().add(5, "minute").unix();
//   end_time = dayjs().add(15, "days").unix();

//   await deployments.fixture(["mocks", "sweepStake", "SSToken"]);
//   const sweepStake = await ethers.getContract("SweepStake");
//   const SSToken = await ethers.getContract("SSToken");

//   const tokenToGive = await sweepStake.getAllowedTokens(0);

//   console.log(tokenToGive);

//   //   const accounts = await ethers.getSigners();
//   //   owner = accounts[0];

//   //   await sweepStake
//   //     .connect(owner)
//   //     .createSweepStake(
//   //       3,
//   //       start_time,
//   //       end_time,
//   //       ethers.utils.parseUnits("3000"),
//   //       "Christmas cheerful giving",
//   //       tokenToGive
//   //     );
// }
// module.exports.tags = ["all", "populate"];
