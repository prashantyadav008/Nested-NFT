import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { exit } from "process";

import { basicMethod } from "./index";

describe("ERC-721 Token Contract", () => {
  let contracts;
  let nftContract;

  let deployer;
  let owner: SignerWithAddress;

  let tokenUri: string;
  let tokenUri2: string;

  beforeEach(async () => {
    contracts = await basicMethod();
    deployer = contracts.deployer;
    owner = contracts.owner;
    nftContract = contracts.nftContract.address;

    tokenUri =
      "https://gateway.pinata.cloud/ipfs/QmSJQm4GKSkfycWh54R2GCwXiHrHHWYvE9iGteRrT9FggK";
    tokenUri2 =
      "https://gateway.pinata.cloud/ipfs/QmSJQm4GKSkfycWh54R2GCwXiHrHHWYvE9iGteRrT9FggK";
  });

  describe("Basic ERC-721 Token Testing", () => {
    it("should check token name ", async () => {
      const { nftContract } = await loadFixture(basicMethod);

      expect(await nftContract.name()).to.be.equal("Nested NFT");
    });

    it("should check token symbol ", async () => {
      const { nftContract } = await loadFixture(basicMethod);
      expect(await nftContract.symbol()).to.be.equal("NN");
    });

    it("should check nft mint by wallet address", async () => {
      const { nestedNft, nftContract, users } = await loadFixture(basicMethod);

      await nestedNft.mint(users[1].address, tokenUri);
      expect(await nftContract.balanceOf(users[1].address)).to.be.equal(
        BigNumber.from(1)
      );
    });

    it("should check nft owner of nft", async () => {
      const { nestedNft, nftContract, users } = await loadFixture(basicMethod);

      await nestedNft.mint(users[1].address, tokenUri);

      expect(await nftContract.ownerOf(1)).to.be.equal(users[1].address);
    });

    it("should check nft token uri", async () => {
      const { nestedNft, nftContract, users } = await loadFixture(basicMethod);

      await nestedNft.mint(users[1].address, tokenUri);
      expect(await nftContract.tokenURI(1)).to.be.equal(tokenUri);
    });

    it("should check Set new Contract Address", async () => {
      const { nestedNft, nftContract, deployer, users } = await loadFixture(
        basicMethod
      );
      expect(await nftContract.usedContract()).to.be.equal(nestedNft.address);

      await nftContract.connect(deployer).setContractAddress(users[1].address);

      expect(await nftContract.usedContract()).to.be.equal(users[1].address);
    });

    it("should check nft contract owner", async () => {
      const { nestedNft, nftContract, deployer, users } = await loadFixture(
        basicMethod
      );
      expect(await nftContract.owner()).to.be.equal(deployer.address);

      await nftContract.connect(deployer).transferOwnership(users[1].address);

      expect(await nftContract.owner()).to.be.equal(users[1].address);
    });
  });

  describe("Revet Message Testing", () => {
    it("should check only Nested NFT Contract mint nft", async () => {
      const { nftContract, users } = await loadFixture(basicMethod);

      await expect(
        nftContract.connect(users[1]).mint(users[1].address, tokenUri)
      ).to.be.revertedWith("Only selected contract do this action!");
    });

    it("should check only Nested NFT Contract burn nft", async () => {
      const { nestedNft, nftContract, users } = await loadFixture(basicMethod);

      await nestedNft.mint(users[1].address, tokenUri);

      await expect(nftContract.connect(users[1]).burn(1)).to.be.revertedWith(
        "Only selected contract do this action!"
      );
    });

    it("should check only Nested NFT Contract transfer nft", async () => {
      const { nestedNft, nftContract, users } = await loadFixture(basicMethod);

      await nestedNft.mint(users[1].address, tokenUri);
      await expect(
        nftContract
          .connect(users[1])
          .transferFrom(users[1].address, users[2].address, 1)
      ).to.be.reverted;
    });

    it("should check Set new Contract Address", async () => {
      const { nestedNft, nftContract, users } = await loadFixture(basicMethod);

      await expect(
        nftContract.connect(users[1]).setContractAddress(users[1].address)
      ).to.be.reverted;
    });
  });
});
