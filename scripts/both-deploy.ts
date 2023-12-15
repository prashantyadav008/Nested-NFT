import { ethers } from "hardhat";

async function main() {
  // ERC721 NFT Contract Deployment
  const nftToken = await ethers.getContractFactory("ERC721Token");
  const nfttoken = await nftToken.deploy();
  console.log("Nft Contract Address-> ", nfttoken.address);

  //
  // Nested NFT Contract Deployment
  const Token = await ethers.getContractFactory("NestedNft");
  const token = await Token.deploy(nfttoken.address);
  console.log("Nested NFT Contract Address-> ", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log("Deploy error-> ", error);
    process.exit(1);
  });
