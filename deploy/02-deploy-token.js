const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { TOKEN_NAME, TOKEN_SYMBOL } = require("../utils/constants");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // If we are on a local development network, we need to deploy mocks!
  if (chainId == 31337) {
    log("Local network detected! Deploying mocks...");
    await deploy("SSToken", {
      from: deployer,
      log: true,
      args: [TOKEN_NAME, TOKEN_SYMBOL],
    });

    log("SSToken Deployed!");
    log("----------------------------------------------------------");
    log(
      "You are deploying to a local network, you'll need a local network running to interact"
    );
    log(
      "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
    );
    log("----------------------------------------------------------");
  }
};
module.exports.tags = ["all", "SSToken"];
