import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from "react-moralis";
import {
  Button,
  Hero,
  Icon,
  Avatar,
  Tag,
  Table,
  useNotification,
} from "web3uikit";
import styles from "../../styles/Home.module.css";
import _ from "underscore";
import { LoadingWidget } from "../../components/LoadingWidget";
import { BaseLayout } from "../../components/Base";
import { abi, contractAddresses, ERC20Abi } from "../../constants";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Countdown from "react-countdown";
import { getERCTokenInfo, maskAddress } from "../../utils/index";
import { ethers, utils } from "ethers";

dayjs.extend(isSameOrBefore);

const DetailPageComponent = () => {
  const router = useRouter();
  const { sweepStakeIndex } = router.query;
  // console.log(sweepStakeIndex, "sweepStakeIndex");

  const {
    Moralis,
    isWeb3Enabled,
    chainId: chainIdHex,
    provider,
    web3,
    account,
  } = useMoralis();

  // console.log("accounts", account);

  const chainId = parseInt(chainIdHex);
  const sweepStakeAddress =
    chainId in contractAddresses
      ? contractAddresses[chainId]["SweepStake.address"][0]
      : null;

  const { runContractFunction: getSweepStakeFn } = useWeb3Contract({
    abi: abi,
    contractAddress: sweepStakeAddress,
    functionName: "getSweepStake",
    params: {
      _sweepStakeIndex: sweepStakeIndex,
    },
  });

  const [sweepStake, setSweepStake] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

  async function getSweepStake() {
    const result = await getSweepStakeFn();
    // console.log(result);
    setSweepStake(result);
  }

  useEffect(() => {
    getSweepStake();
  }, [isWeb3Enabled, sweepStakeIndex]);

  const dispatch = useNotification();

  const handleNewNotification = (isError, msg) => {
    dispatch({
      type: isError ? "error" : "info",
      message: isError
        ? msg ?? "An error occurred"
        : msg ?? "You are a contestant for this stake",
      title: isError ? "Error" : "Transaction Complete!",
      position: "topR",
      icon: "bell",
    });
  };

  // Probably could add some error handling
  const handleSuccess = async (tx) => {
    await tx.wait(1);
    // updateUIValues();
    dispatch({
      type: "info",
      message: "You are now a contestant for this stake",
      title: "Transaction Complete!",
      position: "topR",
      icon: "bell",
    });

    getSweepStake();
    setJoinAsEntrantIsLoading(false);
  };

  // Probably could add some error handling
  const handleError = async (error) => {
    // await tx.wait(1);
    // // console.log(error);
    // updateUIValues();
    dispatch({
      title: "Error",
      type: "error",
      message: error.message.split("'")[2],
      position: "topR",
      icon: "bell",
    });
    setJoinAsEntrantIsLoading(false);
  };

  const [joinAsEntrantIsLoading, setJoinAsEntrantIsLoading] = useState(false);

  const { runContractFunction: joinAsEntrantFn } = useWeb3Contract({
    abi: abi,
    contractAddress: sweepStakeAddress,
    functionName: "joinAsEntrant",
    params: {
      sweepStakesIndex: sweepStakeIndex,
    },
  });

  return (
    <>
      {sweepStake === null || sweepStake === undefined ? (
        <LoadingWidget />
      ) : (
        <div className="">
          <Hero
            align="left"
            backgroundURL="https://moralis.io/wp-content/uploads/2021/06/blue-blob-background-2.svg"
            height="376px"
            rounded="20px"
            textColor="#fff"
            title={`${sweepStake.title} (${sweepStake.entrants.length})`}
            className="mt-5"
          >
            <ListOfSweepStakeInformation sweepStake={sweepStake} web3={web3} />
            {account ? (
              <Button
                icon="plus"
                text="Contest For Prize"
                theme="primary"
                disabled={
                  sweepStake.entrants.includes(utils.getAddress(account)) ||
                  !dayjs.unix(sweepStake.startDateTime).isSameOrBefore(dayjs())
                }
                isLoading={joinAsEntrantIsLoading}
                onClick={() => {
                  if (
                    !sweepStake.entrants.includes(utils.getAddress(account))
                  ) {
                    setJoinAsEntrantIsLoading(true);
                    joinAsEntrantFn({
                      onSuccess: handleSuccess,
                      onError: handleError,
                    });
                  }
                }}
              />
            ) : (
              <></>
            )}
          </Hero>
          {/* <div className="divider"></div> */}
          <TableListForEntrants sweepStake={sweepStake} />
        </div>
      )}
    </>
  );
};

function ListOfSweepStakeInformation(props) {
  const { sweepStake, web3 } = props;

  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    if (sweepStake !== null && sweepStake !== undefined) {
      // console.log("it entered here");
      (async () => {
        const result = await getERCTokenInfo(sweepStake.token, web3);
        // console.log(result);
        setTokenInfo(result);
      })();
    }
  }, [sweepStake]);

  return (
    <>
      <div className="my-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-24 mb-5">
          <div>
            <p className="text-lg font-semibold">Start Date:</p>
            <p>
              {dayjs
                .unix(sweepStake.startDateTime)
                .format("YYYY-MM-DD HH:mm:ss")}
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold">End Date:</p>
            <p>
              {dayjs.unix(sweepStake.endDateTime).format("YYYY-MM-DD HH:mm:ss")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-24 mb-5">
          <div>
            <p className="text-lg font-semibold">Total Amount:</p>
            <p>{` ${utils.formatEther(sweepStake.amount)} ${
              tokenInfo ? tokenInfo.symbol : ""
            }`}</p>
          </div>
          <div>
            <p className="text-lg font-semibold">Total Entrants:</p>
            <p>{` ${sweepStake.entrants.length}`}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-24 mb-5">
          <div>
            <p className="text-lg font-semibold">CountDown:</p>
            <p>
              {dayjs.unix(sweepStake.startDateTime).isSameOrBefore(dayjs()) ? (
                <Countdown
                  date={dayjs.unix(sweepStake.endDateTime).toDate()}
                ></Countdown>
              ) : (
                <b>Yet to start</b>
              )}
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold">Maximum No of Winners:</p>
            <p>{` ${sweepStake.maximumNoOfWinners}`}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function TableListForEntrants(props) {
  const { sweepStake, web3 } = props;
  // console.log(sweepStake.entrants, "sweepStake.entrants");
  // const a = { ...sweepStake };
  // a.entrants = [
  //   "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  //   "0x96915374ABeDD37F1D9f4e2339FB15B75773EbE0",
  //   // "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92265",
  // ];
  // a.winners = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"];

  const entrantTableRow = sweepStake.entrants.map((entrant, index) => {
    return [
      <Avatar key={`avatar-${index}`} isRounded size={36} theme="image" />,
      maskAddress(entrant),
      sweepStake.winners.includes(utils.getAddress(entrant)) ? (
        <Tag key={`tag-${index}`} color="green" text="Winner" />
      ) : (
        <Tag key={`tag-${index}`} color="yellow" text="Entrant" />
      ),
      index,
      <Icon key={`icon-${index}`} fill="black" size={32} svg="more" />,
    ];
  });
  // console.log(entrantTableRow.length, "entrantTableRow");
  return (
    <>
      <Table
        className="mt-8"
        columnsConfig="80px 3fr 2fr 2fr 80px"
        data={[...entrantTableRow]}
        header={[
          "",
          <span key={`address-header`}>Address</span>,
          <span key={`status-header`}>Status</span>,
          <span key={`order-header`}>Entry Order</span>,
          "",
        ]}
        maxPages={3}
        onPageNumberChanged={function noRefCheck() {}}
        pageSize={5}
      />
    </>
  );
}

export default function DetailPage() {
  return (
    <>
      <div className="">
        <BaseLayout
          renderComponent={<DetailPageComponent></DetailPageComponent>}
        />
      </div>
    </>
  );
}
