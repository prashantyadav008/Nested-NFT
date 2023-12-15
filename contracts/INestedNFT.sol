// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract INestedNFT {
    /* Store minted nft owner detail with nft contract address, nft id and nft owner address */
    struct DirectOwner {
        uint256 nftId;
        address ownerAddress;
    }

    /* Store child detail with child id and child address */
    struct Child {
        uint256 childId;
        address childAddress;
    }

    // Used to notify listeners that a new nft minted
    event Mint(uint nftId, address nftOwnerAddress);

    // Used to notify listeners that a new child has been added to a given parent
    // and added in a pending children array
    event ChildProposed(
        uint256 indexed parentId,
        uint256 childIndex,
        address indexed childAddress,
        uint256 indexed childId
    );

    // Used to notify listeners that a new child was accepted by the parent .
    event ChildAccepted(
        uint256 indexed parentId,
        uint256 childIndex,
        address indexed childAddress,
        uint256 indexed childId
    );

    // Used to notify listeners a child has been transferred from new parent.
    event ChildTransferred(
        uint256 indexed parentId,
        uint256 newParentId,
        uint256 childIndex,
        address indexed childAddress,
        uint256 indexed childId,
        bool fromPending
    );

    // Used to notify listeners that all pending/active child of a given parent have been rejected.
    event AllChildrenRejected(
        uint256 indexed parentId,
        address indexed parentAddress,
        bool indexed isPending
    );

    // Used to notify listeners that single pending/multiple child of a given parent have been rejected.
    event ChildsRejected(
        uint256 indexed parentId,
        address indexed parentAddress,
        uint256[] childIds,
        bool indexed isPending
    );

    // Used to notify listeners to get which parent is burned.
    event burning(uint256 indexed parentId, address indexed nftOwnerAddress);
}
