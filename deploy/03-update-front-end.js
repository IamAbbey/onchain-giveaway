const {
  frontEndContractsFile,
  frontEndAbiFile,
} = require("../helper-hardhat-config");
const fs = require("fs");
const { network, deployments } = require("hardhat");

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END || true) {
    console.log("Writing to front end...");
    await updateContractAddresses();
    await updateAbi();
    console.log("Front end written!");
  }
};

async function updateAbi() {
  if (network.config.chainId == 31337) {
    await deployments.fixture(["mocks", "sweepStake"]);
  }
  const sweepStake = await ethers.getContract("SweepStake");
  fs.writeFileSync(
    frontEndAbiFile,
    sweepStake.interface.format(ethers.utils.FormatTypes.json)
  );
}

async function updateContractAddresses() {
  let SSToken = { address: "0x0" };
  // If we are on a local development network, we need to deploy mocks!
  if (network.config.chainId == 31337) {
    await deployments.fixture(["mocks", "sweepStake", "SSToken"]);
    SSToken = await ethers.getContract("SSToken");
  }
  const sweepStake = await ethers.getContract("SweepStake");
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndContractsFile, "utf8")
  );
  if (network.config.chainId.toString() in contractAddresses) {
    if (
      !contractAddresses[network.config.chainId.toString()][
        "SweepStake.address"
      ]?.includes(sweepStake.address)
    ) {
      contractAddresses[network.config.chainId.toString()][
        "SweepStake.address"
      ].push(sweepStake.address);
    }
    if (
      !contractAddresses[network.config.chainId.toString()][
        "SSToken.address"
      ]?.includes(SSToken.address)
    ) {
      contractAddresses[network.config.chainId.toString()][
        "SSToken.address"
      ].push(SSToken.address);
    }
  } else {
    contractAddresses[network.config.chainId.toString()] = {
      "SweepStake.address": [sweepStake.address],
      "SSToken.address": [SSToken.address],
    };
  }
  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}
module.exports.tags = ["all", "frontend"];
