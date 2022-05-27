const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const dayjs = require("dayjs");
const { expect: chai_expect, assert } = require("chai");
const {
  currentBlockTimeStamp,
  fundContractWithLink,
} = require("../../utils/testing-helper");

// const VALID_TOKEN = "0xa36085F69e2889c224210F603D836748e7dC0088";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("testing picking winner", () => {
  let owner,
    createdBy,
    sweepStake,
    tokenToGive,
    customToken,
    customTokenAddress,
    vrfCoordinatorV2Mock;

  beforeEach(async () => {
    [owner, createdBy, ...accounts] = await ethers.getSigners();

    await deployments.fixture(["mocks", "sweepStake", "SSToken"]);

    const start_time = dayjs().add(2, "minutes").unix();
    const end_time = dayjs().add(5, "minutes").unix();

    sweepStake = await ethers.getContract("SweepStake");
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    customToken = await ethers.getContract("SSToken");
    customTokenAddress = customToken.address;

    await sweepStake.addAllowedTokens(customTokenAddress);
    tokenToGive = await sweepStake.getAllowedTokens(0);
    await customToken
      .connect(owner)
      .approve(sweepStake.address, ethers.utils.parseUnits("10"));
    await sweepStake
      .connect(owner)
      .createSweepStake(
        3,
        start_time,
        end_time,
        ethers.utils.parseUnits("5"),
        "Christmas cheerful giving",
        tokenToGive
      );
  });

  describe("checkUpkeep", () => {
    it("returns false if no session has ended", async () => {
      const start_time = dayjs().add(2, "minutes").unix();
      const end_time = dayjs().add(5, "minutes").unix();
      await sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("5"),
          "Christmas cheerful giving",
          tokenToGive
        );

      await network.provider.send("evm_increaseTime", [150]);
      await network.provider.request({ method: "evm_mine", params: [] });

      const { upkeepNeeded, performData } =
        await sweepStake.callStatic.checkUpkeep("0x");

      // const decodeUpkeepResult = ethers.utils.defaultAbiCoder.decode(
      //   ["uint256[]"],
      //   performData
      // );
      // console.log(decodeUpkeepResult);
      assert.isFalse(upkeepNeeded);
    });
    it("returns true since at least a session has ended", async () => {
      await network.provider.send("evm_increaseTime", [1000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded, performData } =
        await sweepStake.callStatic.checkUpkeep("0x");
      const decodeUpkeepResult = ethers.utils.defaultAbiCoder.decode(
        ["uint256[]"],
        performData
      );
      assert.isTrue(upkeepNeeded);
      assert.isAtLeast(decodeUpkeepResult[0].length, 1);
    });
    it("returns true since at two session has ended", async () => {
      await sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          dayjs().add(2, "minutes").unix(),
          dayjs().add(10, "minutes").unix(),
          ethers.utils.parseUnits("5"),
          "Another christmas cheerful giving",
          tokenToGive
        );
      await network.provider.send("evm_increaseTime", [3000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded, performData } =
        await sweepStake.callStatic.checkUpkeep("0x");
      const decodeUpkeepResult = ethers.utils.defaultAbiCoder.decode(
        ["uint256[]"],
        performData
      );
      assert.isTrue(upkeepNeeded);
      assert.equal(decodeUpkeepResult[0].length, 2);
    });
  });

  describe("performUpkeep", () => {
    it("can only run if checkUpkeep is true", async () => {
      await network.provider.send("evm_increaseTime", [140]);
      await network.provider.request({ method: "evm_mine", params: [] });
      await sweepStake.connect(accounts[0]).joinAsEntrant(0);
      await network.provider.send("evm_increaseTime", [1000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded, performData } =
        await sweepStake.callStatic.checkUpkeep("0x");
      const tx = await sweepStake.performUpkeep(performData);
      assert(tx);
    });

    it("reverts if checkUpkeep is not true", async () => {
      await network.provider.send("evm_increaseTime", [140]);
      await sweepStake.connect(accounts[0]).joinAsEntrant(0);
      await network.provider.request({ method: "evm_mine", params: [] });
      await chai_expect(sweepStake.performUpkeep("0x")).to.be.revertedWith(
        "Upkeep not needed"
      );
    });

    it("winners were selected", async () => {
      await network.provider.send("evm_increaseTime", [140]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const additionalEntrances = 3;
      const startingIndex = 0;

      for (
        let i = startingIndex;
        i < startingIndex + additionalEntrances;
        i++
      ) {
        joinSweepStake = sweepStake.connect(accounts[i]);
        await joinSweepStake.joinAsEntrant(0);
      }
      assert.equal(
        (await sweepStake.getSweepStake(0)).entrants.length,
        additionalEntrances
      );

      await network.provider.send("evm_increaseTime", [1000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded, performData } =
        await sweepStake.callStatic.checkUpkeep("0x");
      const tx = await sweepStake.performUpkeep(performData);
      const txReceipt = await tx.wait(1);

      // console.log(txReceipt);

      sweepStake.on(
        "SweepStakeWinnersRequested",
        async (from, to, value, event) => {
          // console.log("here");
          // console.log({
          //   from: from,
          //   to: to,
          //   value: value.toNumber(),
          //   data: event,
          // });
        }
      );
      // console.log(txReceipt);
      // const requestId = txReceipt.events[1].args.requestId.toNumber();

      const previousContractTokenBalance = await customToken.balanceOf(
        sweepStake.address
      );

      const prevAccStartIndexTokenBalance = await customToken.balanceOf(
        accounts[startingIndex].address
      );

      //This will be more important for our staging tests...
      await new Promise(async (resolve, reject) => {
        sweepStake.on(
          "SweepStakeTransferToWinnerSuccess",
          async (from, to, value, event) => {
            assert.equal(
              ethers.utils.formatEther(
                await customToken.balanceOf(event.args.winnerAddress)
              ),
              ethers.utils.formatEther(event.args.amount)
            );
            // console.log({
            //   from: from,
            //   to: to,
            //   value: value.toNumber(),
            //   data: event,
            // });
          }
        );
        sweepStake.once("SweepStakeWinnersPicked", async () => {
          // console.log("here");
          try {
            assert.isAtMost(
              Number(
                ethers.utils.formatEther(
                  previousContractTokenBalance.sub(
                    (await sweepStake.getSweepStake(0)).amount
                  )
                )
              ),
              Number(
                ethers.utils.formatEther(
                  await customToken.balanceOf(sweepStake.address)
                )
              )
            );

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        await vrfCoordinatorV2Mock.fulfillRandomWords(
          txReceipt.events[1].args.requestId,
          sweepStake.address
        );
      });
    });
  });
});
