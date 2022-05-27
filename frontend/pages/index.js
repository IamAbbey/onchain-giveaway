import { useMoralis } from "react-moralis";

import SingleTopCard from "../components/home/SingleTopCard";
import HomeMain from "../components/home/HomeMain";
import { BaseLayout } from "../components/Base";
import styles from "../styles/Home.module.css";
import { ConnectButton, Hero } from "web3uikit";
import _ from "underscore";
const supportedChains = ["31337", "4"];

export default function Home() {
  const { isWeb3Enabled, chainId } = useMoralis();

  return (
    <>
      <BaseLayout renderComponent={<HomeMain></HomeMain>} />
    </>
  );
}
