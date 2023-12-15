import { Provider } from "@ethersproject/abstract-provider";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers } from "hardhat";
import { exit } from "process";

export async function basicMethod() {
  let minutes = 60;
  let seconds = 60;
  let hours = 24;
  let oneMonths = 30;
  let skipTime = 30;
  let day = minutes * seconds * hours;

  let currentTime = BigNumber.from(Math.floor(new Date().getTime() / 1000)).add(
    20
  );

  // random address
  const [deployer, owner, ...users] = await ethers.getSigners();

  // Deploy Token Contract
  const nfttokens = await ethers.getContractFactory("ERC721Token");
  const nftContract = await nfttokens.deploy();

  // Deploy Private Sale Contract
  const nestedNftContract = await ethers.getContractFactory("NestedNft");
  const nestedNft = await nestedNftContract.deploy(nftContract.address);

  const tokenUri1 =
    "https://gateway.pinata.cloud/ipfs/QmVRrkXzbQuMsAKxYnKGNc6CAuxk2x5S4gWqdt2nua3Ziu";

  const tokenUri2 =
    "https://gateway.pinata.cloud/ipfs/QmSJQm4GKSkfycWh54R2GCwXiHrHHWYvE9iGteRrT9FggK";

  const tokenUri3 =
    "https://gateway.pinata.cloud/ipfs/QmXjAJohSiYcLjapAYQLgypNTs7PceVd5o4jUwfTRdvkVj";

  const tokenUri4 =
    "https://gateway.pinata.cloud/ipfs/Qmd74hmRTpCv3hiKXmBALJJZjtDhanFgP1RRZVVmk3xd9r";

  for (let i = 0; i < 10; i++) {
    await nftContract
      .connect(users[i])
      .setApprovalForAll(nestedNft.address, true);
  }

  // setup nested nft contract into nft contract
  await nftContract.connect(deployer).setContractAddress(nestedNft.address);

  return {
    deployer,
    owner,

    users,
    nftContract,
    nestedNft,

    tokenUri1,
    tokenUri2,
    tokenUri3,
    tokenUri4,

    oneMonths,
    skipTime,
    day,
    currentTime,
  };
}

function decimal(value: any) {
  const powValue = BigNumber.from("10").pow(18);
  return BigNumber.from(value).mul(powValue);
}
