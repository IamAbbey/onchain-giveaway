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
        ethers.utils.parseUnits("10"),
        "Christmas cheerful giving",
        tokenToGive
      );
  });

  it("valid: initiate select winners", async () => {
    // await fundContractWithLink(
    //   owner.address,
    //   (amount = ethers.utils.parseUnits("20"))
    // );
    // console.log("funded link");
    await network.provider.send("evm_increaseTime", [460]);
    assert.isDefined(await sweepStake.getSweepStake(0));

    assert.equal(
      (await sweepStake.getStakerSweepStakesIndexes(owner.address)).length,
      1
    );
    // assert.equal((await sweepStake.getUniqueStaker()).length, 1);

    await sweepStake.connect(owner).setSingleSweepStakeToActive(0);

    // await chai_expect(sweepStake.initiateSelectionOfWinners(0)).to.emit(
    //   sweepStake,
    //   "SweepStakeWinnersRequested"
    // );

    const txResponse = await sweepStake.initiateSelectionOfWinners(0);
    const txReceipt = await txResponse.wait(1);
    assert.equal(txReceipt.events[1].args.sweepStakeIndex, 0);
    // console.log("txReceipt.events", txReceipt.events);
    // console.log(txReceipt.events[1].args.requestId);
  });

  it("valid: fulfillRandomWords to select winners", async () => {
    const additionalEntrances = 3;
    const startingIndex = 0;
    await network.provider.send("evm_increaseTime", [160]);
    await sweepStake.connect(owner).setSingleSweepStakeToActive(0);

    for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
      joinSweepStake = sweepStake.connect(accounts[i]);
      await joinSweepStake.joinAsEntrant(0);
    }

    assert.equal(
      (await sweepStake.getSweepStake(0)).entrants.length,
      additionalEntrances
    );

    await network.provider.send("evm_increaseTime", [860]);

    const txResponse = await sweepStake.initiateSelectionOfWinners(0);
    const txReceipt = await txResponse.wait(1);
    assert.equal(txReceipt.events[1].args.sweepStakeIndex, 0);
    const requestId = txReceipt.events[1].args.requestId.toNumber();

    const previousContractTokenBalance = await customToken.balanceOf(
      sweepStake.address
    );

    const prevAccStartIndexTokenBalance = await customToken.balanceOf(
      accounts[startingIndex].address
    );

    // This will be more important for our staging tests...
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
      const tx = await vrfCoordinatorV2Mock.fulfillRandomWords(
        txReceipt.events[1].args.requestId,
        sweepStake.address
      );
    });
  });
  it("valid: fulfillRandomWords to select winners", async () => {
    const additionalEntrances = 4; // more entrants than number of max entrants
    const startingIndex = 0;
    await network.provider.send("evm_increaseTime", [160]);
    await sweepStake.connect(owner).setSingleSweepStakeToActive(0);

    for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
      joinSweepStake = sweepStake.connect(accounts[i]);
      await joinSweepStake.joinAsEntrant(0);
    }

    assert.equal(
      (await sweepStake.getSweepStake(0)).entrants.length,
      additionalEntrances
    );

    await network.provider.send("evm_increaseTime", [860]);

    const txResponse = await sweepStake.initiateSelectionOfWinners(0);
    const txReceipt = await txResponse.wait(1);
    assert.equal(txReceipt.events[1].args.sweepStakeIndex, 0);
    const requestId = txReceipt.events[1].args.requestId.toNumber();

    const previousContractTokenBalance = await customToken.balanceOf(
      sweepStake.address
    );

    const prevAccStartIndexTokenBalance = await customToken.balanceOf(
      accounts[startingIndex].address
    );

    // This will be more important for our staging tests...
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
      const tx = await vrfCoordinatorV2Mock.fulfillRandomWords(
        txReceipt.events[1].args.requestId,
        sweepStake.address
      );
    });
  });
});
