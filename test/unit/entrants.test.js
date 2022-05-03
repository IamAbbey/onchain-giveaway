/* eslint-env jest */

// const { test, expect, describe } = require("@jest/globals");
const { ethers, network } = require("hardhat");
const dayjs = require("dayjs");
const { expect: chai_expect, assert } = require("chai");
const { currentBlockTimeStamp } = require("../../utils/testing-helper");

const VALID_TOKEN = "0xa36085F69e2889c224210F603D836748e7dC0088";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("join as entrants", () => {
  let createdBy, joinedBy, sweepStake, tokenToGive;

  beforeEach(async () => {
    [owner, createdBy, joinedBy] = await ethers.getSigners();
    const SweepStake = await ethers.getContractFactory("SweepStake");
    sweepStake = await SweepStake.deploy();
    await sweepStake.addAllowedTokens(VALID_TOKEN);
    tokenToGive = sweepStake.getAllowedTokens(0);
  });

  describe("should not be able to join", () => {
    it("invalid sweepStake index", async () => {
      await chai_expect(sweepStake.joinAsEntrant(2)).to.be.revertedWith(
        "SweepStake__invalidSweepStakeIndex()"
      );
    });
    it("has not started", async () => {
      start_time = dayjs().add(1, "day").unix();
      end_time = dayjs().add(3, "day").unix();
      await sweepStake
        .connect(createdBy)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        );

      await chai_expect(
        sweepStake.connect(joinedBy).joinAsEntrant(0)
      ).to.be.revertedWith("SweepStake__hasNotStarted()");
    });
    it("has ended", async () => {
      start_time = dayjs().add(1, "minute").unix();
      end_time = dayjs().add(2, "minute").unix();
      await sweepStake
        .connect(createdBy)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        );
      const timeAdjustment = await network.provider.send("evm_increaseTime", [
        300,
      ]);
      await chai_expect(
        sweepStake.connect(joinedBy).joinAsEntrant(0)
      ).to.be.revertedWith("SweepStake__hasEnded()");
    });
  });

  describe("should be able to join", () => {
    beforeEach(async () => {
      [owner, createdBy, joinedBy] = await ethers.getSigners();
      const SweepStake = await ethers.getContractFactory("SweepStake");
      sweepStake = await SweepStake.deploy();
      await sweepStake.addAllowedTokens(VALID_TOKEN);
      tokenToGive = sweepStake.getAllowedTokens(0);
      start_time = dayjs().add(10, "minute").unix();
      end_time = dayjs().add(15, "minute").unix();
      await sweepStake
        .connect(createdBy)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        );
    });
    it("able to join", async () => {
      assert.isDefined(await sweepStake.getSweepStake(0));
      await network.provider.send("evm_increaseTime", [400]);
      await chai_expect(
        sweepStake.connect(joinedBy).joinAsEntrant(0)
      ).to.be.revertedWith("SweepStake__isNotActive()");

      await sweepStake.connect(owner).setSingleSweepStakeToActive(0);
      // await network.provider.request({ method: "evm_mine", params: [] });
      await chai_expect(sweepStake.connect(joinedBy).joinAsEntrant(0)).to.emit(
        sweepStake,
        "NewEntrantJoinedSweepStake"
      );

      assert.equal(
        (await sweepStake.getEntrantSweepStakeIndexMapping(joinedBy.address))
          .length,
        1
      );

      await chai_expect(
        sweepStake.connect(joinedBy).joinAsEntrant(0)
      ).to.be.revertedWith("SweepStake__hasAlreadyJoined()");
    });
  });
});
