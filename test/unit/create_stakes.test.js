/* eslint-env jest */

// const { test, expect, describe } = require("@jest/globals");
const { ethers, network } = require("hardhat");
const dayjs = require("dayjs");
const { expect: chai_expect, assert } = require("chai");
const { currentBlockTimeStamp } = require("../../utils/testing-helper");

const VALID_TOKEN = "0xa36085F69e2889c224210F603D836748e7dC0088";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("create sweep stake: valid", async () => {
  let createdBy, joinedBy, sweepStake, tokenToGive;

  beforeEach(async () => {
    [owner, createdBy, joinedBy] = await ethers.getSigners();
    const SweepStake = await ethers.getContractFactory("SweepStake");
    sweepStake = await SweepStake.deploy();
    await sweepStake.addAllowedTokens(VALID_TOKEN);
    tokenToGive = sweepStake.getAllowedTokens(0);
  });
  it("start time in the past", async () => {
    start_time = dayjs().add(5, "days").unix();
    end_time = dayjs().add(15, "days").unix();

    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        )
    ).to.emit(sweepStake, "NewSweepStakeAdded");

    assert.isDefined(await sweepStake.getSweepStake(0));

    assert.equal(
      (await sweepStake.getStakerSweepStakesIndexes(owner.address)).length,
      1
    );
    assert.equal((await sweepStake.getUniqueStaker()).length, 1);

    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        )
    ).to.emit(sweepStake, "NewSweepStakeAdded");
    assert.equal(
      (await sweepStake.getStakerSweepStakesIndexes(owner.address)).length,
      2
    );
    // despite creating another sweep stake it is expected that the number of
    // unique stakers count should increase since the two above stakes was created
    // by the same address (individual)
    assert.equal((await sweepStake.getUniqueStaker()).length, 1);
  });
});

describe("create sweep stake: invalid", async () => {
  let createdBy, joinedBy, sweepStake, tokenToGive;

  beforeEach(async () => {
    [owner, createdBy, joinedBy] = await ethers.getSigners();
    const SweepStake = await ethers.getContractFactory("SweepStake");
    sweepStake = await SweepStake.deploy();
    await sweepStake.addAllowedTokens(VALID_TOKEN);
    tokenToGive = sweepStake.getAllowedTokens(0);
  });

  it("amount too small", async () => {
    start_time = dayjs().add(1, "minute").unix();
    end_time = dayjs().add(2, "minute").unix();
    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("0"),
          "Christmas cheerful giving",
          tokenToGive
        )
    ).to.be.revertedWith("SweepStake__amountToSmall()");
  });
  it("token not supported", async () => {
    start_time = dayjs().add(1, "minute").unix();
    end_time = dayjs().add(2, "minute").unix();
    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          ZERO_ADDRESS
        )
    ).to.be.revertedWith("SweepStake__tokenNotSupported()");
  });
  it("number of winners less than 1", async () => {
    start_time = dayjs().add(1, "minute").unix();
    end_time = dayjs().add(2, "minute").unix();
    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          0,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        )
    ).to.be.revertedWith("SweepStake__maximumNoOfWinnerLessThanOne()");
  });
  it("end time less than start date", async () => {
    start_time = dayjs().add(1, "minute").unix();
    end_time = dayjs().subtract(5, "minute").unix();
    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        )
    ).to.be.revertedWith("SweepStake__endDateTimeLowerThanStartDateTime()");
  });
  it("start time in the past", async () => {
    start_time = dayjs().subtract(5, "minute").unix();
    end_time = dayjs().add(10, "minute").unix();
    await chai_expect(
      sweepStake
        .connect(owner)
        .createSweepStake(
          3,
          start_time,
          end_time,
          ethers.utils.parseUnits("1000"),
          "Christmas cheerful giving",
          tokenToGive
        )
    ).to.be.revertedWith(
      "SweepStake__startDateTimeLowerThanCurrentBlockDateTime()"
    );
  });
});
