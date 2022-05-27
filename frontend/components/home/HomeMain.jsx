import { useMoralis, useWeb3Contract } from "react-moralis";
import { abi, contractAddresses, ERC20Abi } from "../../constants";
import { useState, useEffect } from "react";
import _ from "underscore";
import { SweepStakeCard } from "../SweepStakeCard";
import SingleTopCard from "./SingleTopCard";
import { Button } from "web3uikit";
import dayjs from "dayjs";
import { ethers, BigNumber } from "ethers";
import { LoadingWidget } from "../LoadingWidget";

export default function HomeMain() {
  const {
    Moralis,
    isWeb3Enabled,
    chainId: chainIdHex,
    provider,
  } = useMoralis();
  // // console.log("provider", provider);

  const chainId = parseInt(chainIdHex);
  const sweepStakeAddress =
    chainId in contractAddresses
      ? contractAddresses[chainId]["SweepStake.address"][0]
      : null;

  const SSTokenAddress =
    chainId in contractAddresses
      ? contractAddresses[chainId]["SSToken.address"][0]
      : null;

  const { runContractFunction: getAllSweepStakesFn } = useWeb3Contract({
    abi: abi,
    contractAddress: sweepStakeAddress,
    functionName: "getAllSweepStakes",
    params: {},
  });

  const [allSweepStakes, setAllSweepStakes] = useState([]);
  const [topCardInfo, setTopCardInfo] = useState({
    sweepStake: 0,
    entrants: 0,
    tokens: 0,
    actives: 0,
  });
  const [pageIsLoading, setPageIsLoading] = useState(true);

  async function getAllSweepStakes() {
    const result = await getAllSweepStakesFn();
    if (result) {
      const temp = {
        sweepStake: result ? result.length : 0,
        entrants: 0,
        tokens: 0,
        actives: 0,
      };
      result.forEach((sweepStake, index) => {
        temp.entrants += sweepStake.entrants.length;
        temp.tokens += BigNumber.from(sweepStake.amount).toNumber();
        temp.actives += sweepStake.isActive ? 1 : 0;
      });
      console.log(temp);
      setAllSweepStakes(result);
      setTopCardInfo({ ...temp });
    }
    setPageIsLoading(false);
  }

  useEffect(() => {
    getAllSweepStakes();
  }, []);

  const items = _.range(10);
  return (
    <>
      {pageIsLoading ? (
        <LoadingWidget />
      ) : (
        <>
          <div className="flex justify-around my-5">
            <SingleTopCard topCardInfo={topCardInfo} />
          </div>

          {_.isEmpty(allSweepStakes) ? (
            <h4 className="text-center my-5">No Record</h4>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-12 ">
              {allSweepStakes.map((value, index) => {
                // console.log(value);
                return (
                  <SweepStakeCard
                    key={index}
                    sweepStake={value}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
