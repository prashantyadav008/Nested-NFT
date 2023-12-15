import { ethers } from "hardhat";

async function main() {
  const erc721Token = "0x800e38F4e97821d47B8A22842504544192157aa3";

  const Token = await ethers.getContractFactory("NestedNft");
  const token = await Token.deploy(erc721Token);
  console.log("Nested NFT Contract Address-> ", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log("Deploy error-> ", error);
    process.exit(1);
  });
