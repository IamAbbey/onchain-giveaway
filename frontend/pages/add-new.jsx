import { Form, DatePicker } from "web3uikit";
import styles from "../styles/Home.module.css";
import { useWeb3Contract, useMoralis } from "react-moralis";
import NewSweepStakeMain from "../components/addNew/addNewMain";
import { BaseLayout } from "../components/Base";

export default function NewSweepStake() {
  const {
    Moralis,
    isWeb3Enabled,
    chainId: chainIdHex,
    provider,
  } = useMoralis();

  return (
    <>
      <div className="">
        <BaseLayout renderComponent={<NewSweepStakeMain></NewSweepStakeMain>} />
      </div>
    </>
  );
}
