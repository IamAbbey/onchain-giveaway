import SingleTopCard from "../components/home/SingleTopCard";
import HomeMain from "../components/home/HomeMain";
import { SweepStakeCard } from "../components/SweepStakeCard";
import styles from "../styles/Home.module.css";
import { ConnectButton, Hero } from "web3uikit";
import _ from "underscore";

import {
  Form,
  DatePicker,
  useNotification,
  TabList,
  Tab,
  Icon,
  Button,
} from "web3uikit";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { abi, contractAddresses, ERC20Abi } from "../constants";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { ethers, utils, BigNumber } from "ethers";
import { parseDateInput } from "../utils/index";
import { LoadingWidget } from "../components/LoadingWidget";

import { BaseLayout } from "../components/Base";
const supportedChains = ["31337", "4"];

export default function Transaction() {
  return (
    <>
      <div className="">
        <BaseLayout
          renderComponent={<TransactionComponent></TransactionComponent>}
        />
      </div>
    </>
  );
}

function TransactionComponent() {
  const {
    Moralis,
    isWeb3Enabled,
    chainId: chainIdHex,
    provider: provider,
    web3: web3,
    account,
  } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const sweepStakeAddress =
    chainId in contractAddresses
      ? contractAddresses[chainId]["SweepStake.address"][0]
      : null;
  const { runContractFunction: getStakerSweepStakesIndexes } = useWeb3Contract({
    abi: abi,
    contractAddress: sweepStakeAddress,
    functionName: "getStakerSweepStakesIndexes",
    params: {
      _stakerAddress: utils.getAddress(account),
    },
  });
  const { runContractFunction: getEntrantSweepStakeIndexMapping } =
    useWeb3Contract({
      abi: abi,
      contractAddress: sweepStakeAddress,
      functionName: "getEntrantSweepStakeIndexMapping",
      params: {
        _entrantAddress: utils.getAddress(account),
      },
    });

  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState(1);
  const [allStakerSweepStakes, setAllStakerSweepStakes] = useState([]);
  const [allEntrantSweepStakes, setAllEntrantSweepStakes] = useState([]);

  useEffect(() => {
    (async () => {
      const indexes =
        selectedKey === 1
          ? await getStakerSweepStakesIndexes()
          : await getEntrantSweepStakeIndexMapping();
      const _list = await Promise.all(
        indexes?.map(async (index) => {
          // console.log(index);
          const sweepStake = new ethers.Contract(sweepStakeAddress, abi, web3);
          //   // console.log(erc20);
          const response = await sweepStake.getSweepStake(index);
          // console.log(response);
          return response;
        })
      );
      if (selectedKey === 1) {
        setAllStakerSweepStakes(_list);
      } else {
        setAllEntrantSweepStakes(_list);
      }
      setPageIsLoading(false);
    })();
  }, [selectedKey]);

  return (
    <>
      {pageIsLoading ? (
        <LoadingWidget />
      ) : (
        <div className="mt-10">
          <TabList
            defaultActiveKey={1}
            tabStyle="bar"
            onChange={(key) => setSelectedKey(key)}
          >
            <Tab
              tabKey={1}
              tabName={
                <div style={{ display: "flex" }}>
                  <span style={{ paddingLeft: "4px" }}>
                    Created SweepStakes{" "}
                  </span>
                </div>
              }
            >
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-12 ">
                {_.isEmpty(allStakerSweepStakes) ? (
                  <h4>No Record</h4>
                ) : (
                  allStakerSweepStakes.map((value, index) => {
                    // console.log(value);
                    return (
                      <SweepStakeCard
                        key={index}
                        sweepStake={value}
                        index={index}
                      />
                    );
                  })
                )}
              </div>
            </Tab>
            <Tab
              tabKey={2}
              tabName={
                <div style={{ display: "flex" }}>
                  <span style={{ paddingLeft: "4px" }}>
                    SweepStakes Entered{" "}
                  </span>
                </div>
              }
            >
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-12 ">
                {_.isEmpty(allEntrantSweepStakes) ? (
                  <h4>No Record</h4>
                ) : (
                  allEntrantSweepStakes.map((value, index) => {
                    // console.log(value);
                    return (
                      <SweepStakeCard
                        key={index}
                        sweepStake={value}
                        index={index}
                      />
                    );
                  })
                )}
              </div>
            </Tab>
          </TabList>
        </div>
      )}
    </>
  );
}
