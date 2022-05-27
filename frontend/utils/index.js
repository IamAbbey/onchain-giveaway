import { abi, contractAddresses, ERC20Abi } from "../constants";
import { ethers, utils } from "ethers";

const getERCTokenInfo = async (token, web3Provider) => {
  const erc20 = new ethers.Contract(token, ERC20Abi, web3Provider);
  const symbol = await erc20.symbol();
  return {
    address: token,
    symbol: symbol,
  };
};

const maskAddress = (address) => {
  if (utils.isAddress(address)) {
    return `${address.substring(0, 5)}.....${address.substring(
      address.length - 5
    )}`;
  }
  return "";
};
const addressExist = (address) => {
  if (utils.isAddress(address)) {
    return `${address.substring(0, 5)}.....${address.substring(
      address.length - 5
    )}`;
  }
  return "";
};

const parseDateInput = (s) => {
  const b = s.split(/\D/);
  return new Date(b[0], --b[1], b[2]);
};

module.exports = {
  getERCTokenInfo,
  maskAddress,
  parseDateInput,
};
