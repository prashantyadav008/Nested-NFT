import { ethers } from "hardhat";

async function main() {
  const Token = await ethers.getContractFactory("ERC721Token");
  const token = await Token.deploy();
  console.log("ERC-721 Token Address-> ", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log("Deploy error-> ", error);
    process.exit(1);
  });

// 0x31c881113FD7402ef3705293091BC73d53b98AE6
// 0xBD65F87A938F25097d0742A6bD7f0214B35ac226
