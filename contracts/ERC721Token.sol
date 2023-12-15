// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract ERC721Token is ERC721URIStorage, Ownable {
    address public usedContract;
    using Counters for Counters.Counter; //liabrary
    Counters.Counter private tokenId;

    // mapping(uint256 => address) public nftOwner;

    constructor() ERC721("Nested NFT", "NN") {}

    modifier onlyContract() {
        require(
            usedContract == msg.sender,
            "Only selected contract do this action!"
        );
        _;
    }

    function setContractAddress(address _contractAddress) public onlyOwner {
        usedContract = _contractAddress;
    }

    function mint(
        address recipient,
        string memory _tokenURI
    ) external onlyContract returns (uint) {
        tokenId.increment();
        uint newItemId = tokenId.current();

        _mint(recipient, newItemId); // attach to item id like recipient == image and newItemid == id like 1, 2
        _setTokenURI(newItemId, _tokenURI);

        return newItemId;
    }

    function burn(uint256 _tokenId) public onlyContract {
        _burn(_tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override onlyContract {}
}
