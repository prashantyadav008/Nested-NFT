import { Provider } from "@ethersproject/abstract-provider";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { exit } from "process";

import { basicMethod } from "./index";

describe("Nested Nft Contract", () => {
  let contracts;

  let deployer: string | Signer | Provider;

  let nullAddress: string;

  let tokenId1: number;
  let tokenId2: number;

  beforeEach(async () => {
    contracts = await basicMethod();
    deployer = contracts.deployer;

    tokenId1 = 1;
    tokenId2 = 2;

    nullAddress = "0x0000000000000000000000000000000000000000";
  });

  describe("Mint Methods", () => {
    it("Should check Mint Nft and Owner Detail", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      await nestedNft.mint(users[0].address, tokenUri1);
      await nestedNft.mint(users[1].address, tokenUri2);

      expect(await nestedNft.directOwnerOf(1)).to.have.deep.members([
        BigNumber.from(tokenId1),
        users[0].address,
      ]);

      expect(await nestedNft.directOwnerOf(2)).to.have.deep.members([
        BigNumber.from(tokenId2),
        users[1].address,
      ]);
    });

    it("Should check Last / Total NFT Mint", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      await nestedNft.mint(users[0].address, tokenUri1);
      await nestedNft.mint(users[1].address, tokenUri2);

      expect(await nestedNft.totalNFT()).to.equal(BigNumber.from(2));
    });

    it("Should check Mint NFT Event", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);

      expect(await nestedNft.directOwnerOf(1))
        .to.emit(nestedNft, "Mint")
        .withArgs(1, users[1].address);

      expect(await nestedNft.directOwnerOf(2))
        .to.emit(nestedNft, "Mint")
        .withArgs(2, users[2].address);
    });

    it("Should check Total Owner Wallet Address", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);

      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );
    });
  });

  describe("Mint and Add Child Methods", () => {
    it("Should check Pending Childrens Of with total childs", async () => {
      const { nftContract, nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      await nestedNft.connect(users[2]).addChild(parentId, childId1);

      await nestedNft.connect(users[3]).addChild(parentId, childId2);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([
        [BigNumber.from(childId1), users[2].address],
        [BigNumber.from(childId2), users[3].address],
      ]);
    });

    it("Should check Child of Parent", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      await nestedNft.connect(users[2]).addChild(parentId, childId1);
      await nestedNft.connect(users[3]).addChild(parentId, childId2);

      expect(await nestedNft.getParentOfChild(childId1)).to.equal(
        BigNumber.from(parentId)
      );
      expect(await nestedNft.getParentOfChild(childId2)).to.equal(
        BigNumber.from(parentId)
      );
    });

    it("Should check Child of Indexing / Place", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      await nestedNft.connect(users[2]).addChild(parentId, childId1);
      await nestedNft.connect(users[3]).addChild(parentId, childId2);

      expect(await nestedNft.getPendingChildIndex(childId1)).to.equal(
        BigNumber.from(0)
      );
      expect(await nestedNft.getPendingChildIndex(childId2)).to.equal(
        BigNumber.from(1)
      );
    });

    it("Should check Single Pending Child Of", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      // mint child
      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      // add child
      await nestedNft.connect(users[2]).addChild(parentId, childId1);
      await nestedNft.connect(users[3]).addChild(parentId, childId2);

      // get child index
      let childIndex1 = await nestedNft.getPendingChildIndex(childId1);
      let childIndex2 = await nestedNft.getPendingChildIndex(childId2);

      // check first child
      expect(
        await nestedNft.pendingChildOf(parentId, childIndex1)
      ).to.have.deep.members([BigNumber.from(childId1), users[2].address]);

      // check second child
      expect(
        await nestedNft.pendingChildOf(parentId, childIndex2)
      ).to.have.deep.members([BigNumber.from(childId2), users[3].address]);
    });

    it("Should check Add Child Event", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      await nestedNft.connect(users[2]).addChild(parentId, childId1);
      await nestedNft.connect(users[3]).addChild(parentId, childId2);

      // get child index
      let childIndex1 = await nestedNft.getPendingChildIndex(childId1);
      let childIndex2 = await nestedNft.getPendingChildIndex(childId2);

      expect(await nestedNft.pendingChildrensOf(parentId))
        .to.emit(nestedNft, "ChildProposed")
        .withArgs(
          [parentId, 0, users[2].address, childId1],
          [parentId, 1, users[3].address, , childId2]
        );
    });

    it("Should check child nft add in contract address", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      await nestedNft.connect(users[2]).addChild(parentId, childId1);
      await nestedNft.connect(users[3]).addChild(parentId, childId2);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(2)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(parentId)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(childId1)).to.equal(
        BigNumber.from(nestedNft.address)
      );

      expect(await nestedNft.nftOwnerOf(childId2)).to.equal(
        BigNumber.from(nestedNft.address)
      );
    });

    it("Should check revert messages", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);
      await nestedNft.mint(users[3].address, tokenUri3);

      await expect(
        nestedNft.connect(users[1]).addChild(parentId, 1)
      ).to.be.revertedWith("Parent and child Id same!");

      await expect(
        nestedNft.connect(users[3]).addChild(parentId, childId1)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      await expect(
        nestedNft.connect(users[5]).addChild(parentId, childId1)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      await expect(
        nestedNft.connect(users[3]).addChild(9, childId2)
      ).to.be.revertedWith("Parent Not Found!");

      await nestedNft.connect(users[2]).addChild(parentId, childId1);
      await expect(
        nestedNft.connect(users[3]).addChild(2, childId2)
      ).to.be.revertedWith("Child already added in Parent!");
    });
  });

  describe("Nested Mint Methods", () => {
    it("Should check Pending Childrens Of with total childs", async () => {
      const { nftContract, nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([
        [BigNumber.from(childId1), users[2].address],
        [BigNumber.from(childId2), users[3].address],
      ]);
    });

    it("Should check Child of Parent", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      expect(await nestedNft.getParentOfChild(childId1)).to.equal(
        BigNumber.from(parentId)
      );
      expect(await nestedNft.getParentOfChild(childId2)).to.equal(
        BigNumber.from(parentId)
      );
    });

    it("Should check Child of Indexing / Place", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      expect(await nestedNft.getPendingChildIndex(childId1)).to.equal(
        BigNumber.from(0)
      );
      expect(await nestedNft.getPendingChildIndex(childId2)).to.equal(
        BigNumber.from(1)
      );
    });

    it("Should check Single Pending Child Of", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      // mint child
      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      // get child index
      let childIndex1 = await nestedNft.getPendingChildIndex(childId1);
      let childIndex2 = await nestedNft.getPendingChildIndex(childId2);

      // check first child
      expect(
        await nestedNft.pendingChildOf(parentId, childIndex1)
      ).to.have.deep.members([BigNumber.from(childId1), users[2].address]);

      // check second child
      expect(
        await nestedNft.pendingChildOf(parentId, childIndex2)
      ).to.have.deep.members([BigNumber.from(childId2), users[3].address]);
    });

    it("Should check Add Child Event", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      // get child index
      let childIndex1 = await nestedNft.getPendingChildIndex(childId1);
      let childIndex2 = await nestedNft.getPendingChildIndex(childId2);

      expect(await nestedNft.pendingChildrensOf(parentId))
        .to.emit(nestedNft, "ChildProposed")
        .withArgs(
          [parentId, 0, users[2].address, childId1],
          [parentId, 1, users[3].address, , childId2]
        );
    });

    it("Should check child nft add in contract address", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(2)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(parentId)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(childId1)).to.equal(
        BigNumber.from(nestedNft.address)
      );

      expect(await nestedNft.nftOwnerOf(childId2)).to.equal(
        BigNumber.from(nestedNft.address)
      );
    });

    it("Should check revert messages", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      await nestedNft.mint(users[1].address, tokenUri1);

      await expect(
        nestedNft.connect(users[2]).nestMint(9, tokenUri2)
      ).to.be.revertedWith("Parent Not Found!");
    });
  });

  describe("Accept Child Methods", () => {
    it("Should check Active Childrens Of with total childs", async () => {
      const { nftContract, nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      expect(await nestedNft.childrensOf(1)).to.have.deep.members([
        [BigNumber.from(childId1), users[2].address],
        [BigNumber.from(childId2), users[3].address],
      ]);
    });

    it("Should check after Active Childrens pending child list empty", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([]);
      expect(await nestedNft.pendingChildrensOf(2)).to.have.deep.members([]);
    });

    it("Should check Child of Indexing / Place", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      expect(await nestedNft.getActiveChildIndex(childId1)).to.equal(
        BigNumber.from(0)
      );
      expect(await nestedNft.getActiveChildIndex(childId2)).to.equal(
        BigNumber.from(1)
      );
    });

    it("Should check Child Active or not", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      // before accept child
      expect(
        await nestedNft.childIsInActive(users[2].address, childId1)
      ).to.equal(false);

      expect(
        await nestedNft.childIsInActive(users[3].address, childId2)
      ).to.equal(false);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      expect(
        await nestedNft.childIsInActive(users[2].address, childId1)
      ).to.equal(true);

      expect(
        await nestedNft.childIsInActive(users[3].address, childId2)
      ).to.equal(true);
    });

    it("Should check Single Pending Child Of", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      // mint child
      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      // get child index
      let childIndex1 = await nestedNft.getActiveChildIndex(childId1);
      let childIndex2 = await nestedNft.getActiveChildIndex(childId2);

      // check first child
      expect(
        await nestedNft.childOf(parentId, childIndex1)
      ).to.have.deep.members([BigNumber.from(childId1), users[2].address]);

      // check second child
      expect(
        await nestedNft.childOf(parentId, childIndex2)
      ).to.have.deep.members([BigNumber.from(childId2), users[3].address]);
    });

    it("Should check Add Child Event", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      expect(await nestedNft.childrensOf(parentId))
        .to.emit(nestedNft, "ChildProposed")
        .withArgs(
          [parentId, 0, users[2].address, childId1],
          [parentId, 1, users[3].address, , childId2]
        );
    });

    it("Should check child nft add in contract address", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;
      let childId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[3].address, childId2);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(3)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(parentId)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(childId1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(childId2)).to.equal(
        BigNumber.from(users[1].address)
      );
    });

    it("Should check revert messages", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2, tokenUri3 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      let childId1 = 2;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId, tokenUri3);

      await expect(
        nestedNft
          .connect(users[2])
          .acceptChild(parentId, 0, users[2].address, childId1)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      // accept child
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId, 0, users[2].address, childId1);

      await expect(
        nestedNft
          .connect(users[1])
          .acceptChild(parentId, 0, users[2].address, childId1)
      ).to.be.revertedWith("Child Already Accepted!");

      await expect(
        nestedNft
          .connect(users[1])
          .acceptChild(parentId, 0, users[2].address, 3)
      ).to.be.revertedWith("Child Address not Matched!");

      await expect(
        nestedNft
          .connect(users[1])
          .acceptChild(parentId, 0, users[3].address, 5)
      ).to.be.revertedWith("Detail not Found!");

      //
    });
  });

  describe("Transfer Child Methods", () => {
    it("Should check Transfer Pending Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 2;
      let childId1 = 3;

      let childIndex = 0;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri1);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .transferChild(parentId1, parentId2, childIndex, childId1, true);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([]);

      expect(await nestedNft.pendingChildrensOf(2)).to.have.deep.members([
        [BigNumber.from(childId1), users[3].address],
      ]);
    });

    it("Should check Transfer Active Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 2;
      let childId1 = 3;

      let childIndex = 0;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri1);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, childId1);

      await nestedNft
        .connect(users[1])
        .transferChild(parentId1, parentId2, childIndex, childId1, false);

      expect(await nestedNft.childrensOf(1)).to.have.deep.members([]);

      expect(await nestedNft.childrensOf(2)).to.have.deep.members([
        [BigNumber.from(childId1), users[3].address],
      ]);
    });

    it("Should check Transfer Child Event", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 2;
      let childId1 = 3;

      let childIndex = 0;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri1);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .transferChild(parentId1, parentId2, childIndex, childId1, true);

      expect(await nestedNft.childrensOf(parentId1))
        .to.emit(nestedNft, "ChildProposed")
        .withArgs([parentId1, parentId2, 0, users[3].address, childId1]);
    });

    it("Should check after transfer pending child Nft still in contract", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 2;
      let childId1 = 3;

      let childIndex = 0;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri1);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .transferChild(parentId1, parentId2, childIndex, childId1, true);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      // check balance
      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(parentId1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(parentId2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(childId1)).to.equal(
        BigNumber.from(nestedNft.address)
      );
    });

    it("Should check after transfer active child Nft transfer to new parrent address", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 2;
      let childId1 = 3;

      let childIndex = 0;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri1);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, childId1);

      await nestedNft
        .connect(users[1])
        .transferChild(parentId1, parentId2, childIndex, childId1, false);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      // check balance
      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(2)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(parentId1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(parentId2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(parentId2)).to.equal(
        BigNumber.from(users[2].address)
      );
    });

    it("Should check revert messages", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 2;
      let childId1 = 3;

      let childIndex = 0;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri1);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);

      await expect(
        nestedNft
          .connect(users[2])
          .transferChild(parentId1, parentId2, childIndex, childId1, true)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      await expect(
        nestedNft
          .connect(users[1])
          .transferChild(parentId1, childId1, childIndex, childId1, true)
      ).to.be.revertedWith("Parent and child Id same!");

      await expect(
        nestedNft
          .connect(users[1])
          .transferChild(parentId1, childId1, childIndex, 4, true)
      ).to.be.revertedWith("Detail not Found!");

      //
    });
  });

  describe("Reject All Child Methods", () => {
    it("Should check Reject All Pending Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);

      await nestedNft.connect(users[1]).rejectAllChildren(parentId1, true);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([]);
      for (let i = 2; i <= 6; i++) {
        expect(await nestedNft.getParentOfChild(i)).to.equal(BigNumber.from(0));
        expect(await nestedNft.getPendingChildIndex(i)).to.equal(
          BigNumber.from(0)
        );
      }
    });

    it("Should check Reject All Active Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[2].address, 2);

      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, 3);

      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[4].address, 4);

      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[5].address, 5);

      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[6].address, 6);

      await nestedNft.connect(users[1]).rejectAllChildren(parentId1, false);

      expect(await nestedNft.childrensOf(1)).to.have.deep.members([]);
      for (let i = 2; i <= 6; i++) {
        expect(await nestedNft.getParentOfChild(i)).to.equal(BigNumber.from(0));
        expect(await nestedNft.getActiveChildIndex(i)).to.equal(
          BigNumber.from(0)
        );
      }
    });

    it("Should check reject all pending child nft to correct nft owner ", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[7]).nestMint(parentId1, tokenUri2);

      await nestedNft.connect(users[1]).rejectAllChildren(parentId1, true);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[4].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[5].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[6].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[7].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(3)).to.equal(
        BigNumber.from(users[3].address)
      );

      expect(await nestedNft.nftOwnerOf(4)).to.equal(
        BigNumber.from(users[4].address)
      );

      expect(await nestedNft.nftOwnerOf(5)).to.equal(
        BigNumber.from(users[5].address)
      );

      expect(await nestedNft.nftOwnerOf(6)).to.equal(
        BigNumber.from(users[6].address)
      );

      expect(await nestedNft.nftOwnerOf(7)).to.equal(
        BigNumber.from(users[7].address)
      );
    });

    it("Should check reject all accept child nft to correct nft owner ", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[2].address, 2);

      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, 3);

      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[4].address, 4);

      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[5].address, 5);

      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[6].address, 6);

      await nestedNft.connect(users[7]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[7].address, 7);

      await nestedNft.connect(users[1]).rejectAllChildren(parentId1, false);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[4].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[5].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[6].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[7].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(3)).to.equal(
        BigNumber.from(users[3].address)
      );

      expect(await nestedNft.nftOwnerOf(4)).to.equal(
        BigNumber.from(users[4].address)
      );

      expect(await nestedNft.nftOwnerOf(5)).to.equal(
        BigNumber.from(users[5].address)
      );

      expect(await nestedNft.nftOwnerOf(6)).to.equal(
        BigNumber.from(users[6].address)
      );

      expect(await nestedNft.nftOwnerOf(7)).to.equal(
        BigNumber.from(users[7].address)
      );
    });

    it("Should check Event for all Pending Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);

      expect(
        await nestedNft.connect(users[1]).rejectAllChildren(parentId1, true)
      )
        .to.emit(nestedNft, "AllChildrenRejected")
        .withArgs([parentId1, users[1].address, true]);
    });

    it("Should check revert message", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);

      await expect(
        nestedNft.connect(users[2]).rejectAllChildren(parentId1, false)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      await expect(
        nestedNft.connect(users[2]).rejectAllChildren(2, false)
      ).to.be.revertedWith("Child already added in Parent!");
    });
  });

  describe("Reject Single or Multiple Child Methods", () => {
    it("Should check Reject Single Pending Child and All", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [2, 5, 4, 3, 6], true);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([]);
      for (let i = 2; i <= 6; i++) {
        expect(await nestedNft.getParentOfChild(i)).to.equal(BigNumber.from(0));
        expect(await nestedNft.getPendingChildIndex(i)).to.equal(
          BigNumber.from(0)
        );
      }
    });

    it("Should check Reject Few Pending Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [4, 2, 6], true);

      expect(await nestedNft.pendingChildrensOf(1)).to.have.deep.members([
        [BigNumber.from(5), users[5].address],
        [BigNumber.from(3), users[3].address],
      ]);

      // check indeing value and parent of remaing child
      expect(await nestedNft.getParentOfChild(5)).to.equal(BigNumber.from(1));
      expect(await nestedNft.getPendingChildIndex(5)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.getPendingChildIndex(3)).to.equal(
        BigNumber.from(1)
      );
      expect(await nestedNft.getParentOfChild(3)).to.equal(BigNumber.from(1));
    });

    it("Should check Reject Single Active Child and All", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[2].address, 2);

      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, 3);

      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[4].address, 4);

      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[5].address, 5);

      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[6].address, 6);

      //
      // Reject Child
      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [2, 5, 4, 3, 6], false);

      expect(await nestedNft.childrensOf(1)).to.have.deep.members([]);

      for (let i = 2; i <= 6; i++) {
        expect(await nestedNft.getParentOfChild(i)).to.equal(BigNumber.from(0));
        expect(await nestedNft.getActiveChildIndex(i)).to.equal(
          BigNumber.from(0)
        );
      }
    });

    it("Should check Reject Few Active Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[2].address, 2);

      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, 3);

      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[4].address, 4);

      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[5].address, 5);

      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[6].address, 6);

      //
      // reject childs
      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [4, 2, 6], false);

      expect(await nestedNft.childrensOf(1)).to.have.deep.members([
        [BigNumber.from(5), users[5].address],
        [BigNumber.from(3), users[3].address],
      ]);

      // check indeing value and parent of remaing child
      expect(await nestedNft.getParentOfChild(5)).to.equal(BigNumber.from(1));
      expect(await nestedNft.getActiveChildIndex(5)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.getActiveChildIndex(3)).to.equal(
        BigNumber.from(1)
      );
      expect(await nestedNft.getParentOfChild(3)).to.equal(BigNumber.from(1));
    });

    it("Should check reject all pending child nft to correct nft owner ", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[7]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [2, 3, 4, 5, 6, 7], true);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[4].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[5].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[6].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[7].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(3)).to.equal(
        BigNumber.from(users[3].address)
      );

      expect(await nestedNft.nftOwnerOf(4)).to.equal(
        BigNumber.from(users[4].address)
      );

      expect(await nestedNft.nftOwnerOf(5)).to.equal(
        BigNumber.from(users[5].address)
      );

      expect(await nestedNft.nftOwnerOf(6)).to.equal(
        BigNumber.from(users[6].address)
      );

      expect(await nestedNft.nftOwnerOf(7)).to.equal(
        BigNumber.from(users[7].address)
      );
    });

    it("Should check reject few pending child nft to correct nft owner ", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);

      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [4, 2, 6], true);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[4].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[5].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[6].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(2)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(3)).to.equal(
        BigNumber.from(nestedNft.address)
      );

      expect(await nestedNft.nftOwnerOf(4)).to.equal(
        BigNumber.from(users[4].address)
      );

      expect(await nestedNft.nftOwnerOf(5)).to.equal(
        BigNumber.from(nestedNft.address)
      );

      expect(await nestedNft.nftOwnerOf(6)).to.equal(
        BigNumber.from(users[6].address)
      );
    });

    it("Should check reject all accept child nft to correct nft owner ", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[2].address, 2);

      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[3].address, 3);

      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[4].address, 4);

      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[5].address, 5);

      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);
      await nestedNft
        .connect(users[1])
        .acceptChild(parentId1, 0, users[6].address, 6);

      await nestedNft
        .connect(users[1])
        .rejectChilds(parentId1, [4, 2, 6], false);

      // check balance
      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(3)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[3].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[4].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(users[5].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[6].address)).to.equal(
        BigNumber.from(1)
      );

      expect(await nestedNft.balanceOf(nestedNft.address)).to.equal(
        BigNumber.from(0)
      );

      // check nft owner address
      expect(await nestedNft.nftOwnerOf(1)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(2)).to.equal(
        BigNumber.from(users[2].address)
      );

      expect(await nestedNft.nftOwnerOf(3)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(4)).to.equal(
        BigNumber.from(users[4].address)
      );

      expect(await nestedNft.nftOwnerOf(5)).to.equal(
        BigNumber.from(users[1].address)
      );

      expect(await nestedNft.nftOwnerOf(6)).to.equal(
        BigNumber.from(users[6].address)
      );
    });

    it("Should check Event for reject few Pending Child", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[3]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[4]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[5]).nestMint(parentId1, tokenUri2);
      await nestedNft.connect(users[6]).nestMint(parentId1, tokenUri2);

      expect(
        await nestedNft
          .connect(users[1])
          .rejectChilds(parentId1, [2, 4, 6], true)
      )
        .to.emit(nestedNft, "ChildsRejected")
        .withArgs([parentId1, users[1].address, [2, 4, 6], true]);
    });

    it("Should check revert message", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;

      await nestedNft.mint(users[1].address, tokenUri1);

      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);

      await expect(
        nestedNft.connect(users[2]).rejectChilds(parentId1, [2], true)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      await expect(
        nestedNft.connect(users[2]).rejectChilds(2, [2], true)
      ).to.be.revertedWith("Child already added in Parent!");

      await expect(
        nestedNft.connect(users[1]).rejectChilds(parentId1, [5], false)
      ).to.be.reverted;
    });
  });

  describe("Burn Methods", () => {
    it("Should check Burn Nft and Owner Detail", async () => {
      const { nftContract, nestedNft, users, tokenUri1, tokenUri2 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);

      await nestedNft.connect(users[1]).burn(parentId);

      expect(await nestedNft.directOwnerOf(parentId)).to.have.deep.members([
        BigNumber.from(0),
        nullAddress,
      ]);

      expect(await nestedNft.directOwnerOf(2)).to.have.deep.members([
        BigNumber.from(2),
        users[2].address,
      ]);
    });

    it("Should check Burn NFT Event", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId = 1;
      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);

      expect(await nestedNft.directOwnerOf(1))
        .to.emit(nestedNft, "Mint")
        .withArgs(1, users[1].address);

      expect(await nestedNft.directOwnerOf(2))
        .to.emit(nestedNft, "Mint")
        .withArgs(2, users[2].address);

      expect(await nestedNft.connect(users[1]).burn(parentId))
        .to.emit(nestedNft, "burning")
        .withArgs(1, users[1].address);
    });

    it("Should check burn nft in erc token contract", async () => {
      const { nftContract, nestedNft, users, tokenUri1, tokenUri2 } =
        await loadFixture(basicMethod);

      let parentId = 1;
      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.mint(users[2].address, tokenUri2);

      await nestedNft.connect(users[1]).burn(parentId);

      expect(await nestedNft.balanceOf(users[1].address)).to.equal(
        BigNumber.from(0)
      );

      expect(await nestedNft.balanceOf(users[2].address)).to.equal(
        BigNumber.from(1)
      );
    });

    it("Should check revert message", async () => {
      const { nestedNft, users, tokenUri1, tokenUri2 } = await loadFixture(
        basicMethod
      );

      let parentId1 = 1;
      let parentId2 = 3;

      await nestedNft.mint(users[1].address, tokenUri1);
      await nestedNft.connect(users[2]).nestMint(parentId1, tokenUri2);

      await nestedNft.mint(users[3].address, tokenUri1);

      await expect(
        nestedNft.connect(users[1]).burn(parentId2)
      ).to.be.revertedWith("Only NFT Owner can do this action!");

      await expect(
        nestedNft.connect(users[1]).burn(parentId1)
      ).to.be.revertedWith("This Parent has Child!");

      await expect(nestedNft.connect(users[2]).burn(2)).to.be.revertedWith(
        "Child already added in Parent!"
      );
    });
  });

  //
});
