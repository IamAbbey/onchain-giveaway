import { useMoralis } from "react-moralis";

import styles from "../styles/Home.module.css";
import { ConnectButton, Hero } from "web3uikit";
import _ from "underscore";
const supportedChains = ["31337", "4"];

export function BaseLayout(props) {
  const { isWeb3Enabled, chainId } = useMoralis();
  // const isWeb3Enabled = true;
  const { renderComponent } = props;
  return (
    <>
      <div className={styles.container}>
        {isWeb3Enabled ? (
          <div>
            {supportedChains.includes(parseInt(chainId).toString()) ? (
              renderComponent
            ) : (
              <Web3NotEnabled
                msg={`Please switch to a supported chainId. The supported Chain Ids are: ${supportedChains}`}
              />
            )}
          </div>
        ) : (
          <Web3NotEnabled msg="Please connect to a Wallet" />
        )}
      </div>
    </>
  );
}

function Web3NotEnabled(props) {
  const { msg } = props;
  return (
    <>
      <div className="font-mono flex justify-center mt-20">
        <div className="w-full sm:w-auto">
          <Hero
            align="center"
            backgroundURL="https://moralis.io/wp-content/uploads/2021/06/blue-blob-background-2.svg"
            height="176px"
            rounded="20px"
            textColor="#fff"
            title={msg}
          >
            <ConnectButton moralisAuth={false} />
          </Hero>
        </div>
      </div>
    </>
  );
}
