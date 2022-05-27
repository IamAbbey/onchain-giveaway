import {
  Form,
  DatePicker,
  useNotification,
  TabList,
  Tab,
  Icon,
} from "web3uikit";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { abi, contractAddresses, ERC20Abi } from "../../constants";
import { useState, useEffect } from "react";
import _ from "underscore";
import { Button, Select } from "web3uikit";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { ethers, utils, BigNumber } from "ethers";
import { parseDateInput } from "../../utils/index";
import { LoadingWidget } from "../LoadingWidget";

export default function NewSweepStakeMain() {
  const {
    Moralis,
    isWeb3Enabled,
    chainId: chainIdHex,
    provider,
    web3,
  } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const sweepStakeAddress =
    chainId in contractAddresses
      ? contractAddresses[chainId]["SweepStake.address"][0]
      : null;

  const SSTokenAddress =
    chainId in contractAddresses
      ? contractAddresses[chainId]["SSToken.address"][0]
      : null;

  const { runContractFunction: addAllowedTokens } = useWeb3Contract({
    abi: abi,
    contractAddress: sweepStakeAddress,
    functionName: "addAllowedTokens",
    params: {
      _token: SSTokenAddress,
    },
  });

  return (
    <>
      {/* <Button
        icon="plus"
        iconLayout="trailing"
        id="test-button-primary-icon-after"
        onClick={() => {
          addAllowedTokens();
        }}
        text="Primary with icon"
        theme="primary"
        type="button"
      /> */}

      <CreateSweepStakeForm
        isWeb3Enabled={isWeb3Enabled}
        sweepStakeAddress={sweepStakeAddress}
      />
    </>
  );
}

function CreateSweepStakeForm(props) {
  const {
    Moralis,
    isWeb3Enabled,
    chainId: chainIdHex,
    provider,
    web3,
    account,
  } = useMoralis();

  const router = useRouter();

  const {
    runContractFunction: getAllAllowedTokens,
    isFetching: getAllAllowedTokensIsFetching,
    isLoading: getAllAllowedTokensIsLoading,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: props.sweepStakeAddress,
    functionName: "getAllAllowedTokens",
    params: {},
  });

  const {
    runContractFunction: getStakerSweepStakesIndexes,
    isFetching: getStakerSweepStakesIndexesIsFetching,
    isLoading: getStakerSweepStakesIndexesIsLoading,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: props.sweepStakeAddress,
    functionName: "getStakerSweepStakesIndexes",
    params: {
      _stakerAddress: utils.getAddress(account),
    },
  });

  const [allAllowedTokens, setAllAllowedTokens] = useState([]);
  const [creatingIsLoading, setCreatingIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    selectedToken: "",
    amount: "0.0",
    maximumNoOfWinners: 1,
    startDate: dayjs(new Date()),
    endDate: dayjs(new Date()),
  });

  const _getAllAllowedTokensFn = async () => {
    const _allAllowedTokens = await getAllAllowedTokens();
    //// console.log(_allAllowedTokens);

    const _list = _allAllowedTokens
      ? await Promise.all(
          _allAllowedTokens?.map(async (token) => {
            // console.log(token);
            const erc20 = new ethers.Contract(token, ERC20Abi, web3);
            // console.log(erc20);
            const symbol = await erc20.symbol();
            return {
              address: token,
              symbol: symbol,
            };
          })
        )
      : [];
    // console.log(_list);
    setAllAllowedTokens(_list);
  };

  useEffect(() => {
    _getAllAllowedTokensFn();
  }, [isWeb3Enabled]);

  const dispatch = useNotification();

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Complete!",
      title: "Transaction Notification",
      position: "topR",
      icon: "bell",
    });
  };

  // Probably could add some error handling
  const handleSuccess = async (tx) => {
    await tx.wait(1);
    // updateUIValues();
    // console.log(tx);
    // console.log(typeof tx);
    handleNewNotification(tx);

    const _indexes = await getStakerSweepStakesIndexes();
    const recentIndex = BigNumber.from(_.last(_indexes)).toNumber();
    router.push(`sweepstakes/${recentIndex}`);
    setCreatingIsLoading(false);
  };

  const handleError = async (error) => {
    // // console.log(error.message.split("'"));
    // // console.log(error.message.split("'")[2]);
    // // console.log(JSON.parse(error.message.split("'")[1]));
    dispatch({
      type: "error",
      title: "Error",
      message: error.message.split("'")[2],
      position: "topR",
      isClosing: false,
    });
    setCreatingIsLoading(false);
  };

  const { runContractFunction: createSweepStake } = useWeb3Contract({
    abi: abi,
    contractAddress: props.sweepStakeAddress,
    functionName: "createSweepStake",
    params: {
      _maximumNoOfWinners: formData.maximumNoOfWinners,
      _startDateTime: formData.startDate.unix(),
      _endDateTime: formData.endDate.unix(),
      _amount: ethers.utils.parseUnits(
        _.isEmpty(formData.amount) ? "0.0" : formData.amount
      ),
      _title: formData.title,
      _token: formData.selectedToken,
    },
  });

  const approveERC20Tx = async () => {
    const erc20 = new ethers.Contract(
      formData.selectedToken,
      ERC20Abi,
      web3.getSigner()
    );

    const tx = await erc20.approve(
      props.sweepStakeAddress,
      ethers.utils.parseUnits(formData.amount)
    );

    await tx.wait(1);

    // console.log(formData);

    // console.log({
    //   _maximumNoOfWinners: formData.maximumNoOfWinners,
    //   _startDateTime: formData.startDate.unix(),
    //   _endDateTime: formData.endDate.unix(),
    //   _amount: formData.amount,
    //   _title: formData.title,
    //   _token: formData.selectedToken,
    // });

    await createSweepStake({
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  const onFormSubmit = (event) => {
    event.preventDefault();
    if (
      _.isEmpty(formData.title) ||
      _.isEmpty(formData.selectedToken) ||
      _.isEmpty(formData.amount) ||
      _.isEmpty(formData.maximumNoOfWinners)
    ) {
      dispatch({
        type: "error",
        title: "Error",
        message: "Invalid data detected",
        position: "topR",
        isClosing: false,
      });
      return;
    }
    setCreatingIsLoading(true);

    approveERC20Tx();
  };

  return (
    <>
      {getAllAllowedTokensIsFetching ? (
        <LoadingWidget />
      ) : (
        <div className="flex justify-center">
          <form action="" onSubmit={onFormSubmit} className="basis-1/2">
            <h2 className="mt-5 text-2xl">Create SweepStake Form</h2>
            <div className="form-control my-5">
              <label className="input-group input-group-vertical">
                <span>Title</span>
                <input
                  type="text"
                  placeholder="Title"
                  className="input input-bordered"
                  value={formData.title}
                  onChange={(element) =>
                    setFormData({ ...formData, title: element.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-control my-5">
              <div className="input-group input-group-vertical">
                <span>Token</span>
                <select
                  className="select select-bordered"
                  defaultValue=""
                  onChange={(element) =>
                    setFormData({
                      ...formData,
                      selectedToken: element.target.value,
                    })
                  }
                >
                  <option disabled value="">
                    Select Token to Give
                  </option>
                  {allAllowedTokens.map((token, index) => {
                    return (
                      <option key={index} value={token.address}>
                        {token.symbol}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="form-control my-5">
              <label className="input-group input-group-vertical">
                <span>Amount</span>
                <input
                  type="number"
                  placeholder="Amount"
                  className="input input-bordered"
                  min={0}
                  value={formData.amount}
                  onChange={(element) =>
                    setFormData({
                      ...formData,
                      amount: element.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-control my-5">
              <label className="input-group input-group-vertical">
                <span className="small">No of winners</span>
                <input
                  type="number"
                  placeholder="Maximum number of winners"
                  className="input input-bordered"
                  min={1}
                  max={500}
                  value={formData.maximumNoOfWinners}
                  onChange={(element) =>
                    setFormData({
                      ...formData,
                      maximumNoOfWinners: element.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control my-5">
                <label className="input-group input-group-vertical">
                  <span className="small">Start Date</span>
                  <input
                    type="date"
                    className="input input-bordered"
                    onChange={(element) => {
                      // console.log(element.target.value);
                      // console.log(parseDateInput(element.target.value));
                      setFormData({
                        ...formData,
                        startDate: dayjs(parseDateInput(element.target.value)),
                      });
                    }}
                  />
                </label>
              </div>
              <div className="form-control my-5">
                <label className="input-group input-group-vertical">
                  <span className="small">Start Time</span>
                  <input
                    type="time"
                    className="input input-bordered"
                    onChange={(element) => {
                      // console.log(element.target.value);
                      // console.log(element.target.value.split(":")[0]);
                      // console.log(element.target.value.split(":")[1]);
                      setFormData({
                        ...formData,
                        startDate: formData.startDate
                          .set("hour", element.target.value.split(":")[0])
                          .set("minute", element.target.value.split(":")[1]),
                      });
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control my-5">
                <label className="input-group input-group-vertical">
                  <span className="small">End Date</span>
                  <input
                    type="date"
                    placeholder="Amount"
                    className="input input-bordered"
                    onChange={(element) => {
                      // console.log(element.target.value);
                      // console.log(parseDateInput(element.target.value));
                      setFormData({
                        ...formData,
                        endDate: dayjs(parseDateInput(element.target.value)),
                      });
                    }}
                  />
                </label>
              </div>
              <div className="form-control my-5">
                <label className="input-group input-group-vertical">
                  <span className="small">End Time</span>
                  <input
                    type="time"
                    className="input input-bordered"
                    onChange={(element) => {
                      // console.log(element.target.value);
                      // console.log(element.target.value.split(":")[0]);
                      // console.log(element.target.value.split(":")[1]);
                      setFormData({
                        ...formData,
                        endDate: formData.endDate
                          .set("hour", element.target.value.split(":")[0])
                          .set("minute", element.target.value.split(":")[1]),
                      });
                    }}
                  />
                </label>
              </div>
            </div>
            {creatingIsLoading ? (
              <button className="btn btn-block loading" disabled={true}>
                Create
              </button>
            ) : (
              <button className="btn btn-block">Create</button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
