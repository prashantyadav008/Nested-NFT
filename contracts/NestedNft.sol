// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ERC721Token.sol";
import "./INestedNFT.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "hardhat/console.sol";

contract NestedNft is INestedNFT, ERC721Holder {
    // store Nft Owners with values.
    mapping(uint256 => DirectOwner) _directOwners;

    // Store and Show no. of total nft owners added
    uint256 public totalNFT;

    // store parent for single child to get who is the parent of a child.
    mapping(uint256 => uint) _parentOfChild;

    // store child indexing id in a pendingChild list
    mapping(uint256 => uint) _pendingChildIndex;

    // store child indexing id in a activeChild list
    mapping(uint256 => uint) _activeChildIndex;

    // store number of pending child into parent
    mapping(uint256 => Child[]) _pendingChildren;

    // store number of active child into parent
    mapping(uint256 => Child[]) _activeChildren;

    // store active child is active or not.
    mapping(address => mapping(uint256 => uint256)) _childIsInActive;

    // store nft contract address.
    ERC721Token public nfttoken;

    constructor(ERC721Token _nfttoken) {
        // put erc721 token address in nfttoken variable.
        nfttoken = _nfttoken;
    }

    modifier onlyNftOwner(uint256 parentId) {
        require(
            _directOwners[parentId].ownerAddress == msg.sender,
            "Only NFT Owner can do this action!"
        );
        _;
    }

    // ======================================================================================================== //
    //                                              Read Methods                                                //
    //                                                                                                          //
    // directOwnerOf: Show minted nft owner details with nft contract address, nft id and nft owner address     //
    // balanceOf: Show nft count of the user                                                                    //
    // pendingChildrensOf: Show all pending child added in a parent                                             //
    // pendingChildOf: Show single pending child of a parent                                                    //
    // childrensOf: Show all active child added in a parent                                                     //
    // childOf: Show single active child of a parent                                                            //
    // childIsInActive: Show which child is active or not                                                       //
    // getPendingChildIndex: Show indexing id of a child to pending child list                                  //
    // getActiveChildIndex: Show indexing id of a child to active child list                                    //
    // getParentOfChild: show parent id of a child                                                              //
    // ======================================================================================================== //

    // Show minted nft owner details with nft contract address, nft id and nft owner address
    function directOwnerOf(
        uint256 _ownerId
    ) public view returns (DirectOwner memory) {
        return _directOwners[_ownerId];
    }

    // Show nft count of the user
    function balanceOf(address _to) public view returns (uint) {
        return nfttoken.balanceOf(_to);
    }

    // Show nft count of the user
    function nftOwnerOf(uint256 nftId) public view returns (address) {
        return nfttoken.ownerOf(nftId);
    }

    // Show all pending child added in a parent
    function pendingChildrensOf(
        uint256 parentId
    ) public view returns (Child[] memory) {
        return _pendingChildren[parentId];
    }

    // Show single pending child of a parent
    function pendingChildOf(
        uint256 parentId,
        uint256 childIndex
    ) public view virtual returns (Child memory) {
        require(
            pendingChildrensOf(parentId).length >= childIndex,
            "Pending Child Index Out Of Range !"
        );

        // as array indexing start from 0
        return _pendingChildren[parentId][childIndex];
    }

    // Show all active child added in a parent
    function childrensOf(
        uint256 parentId
    ) public view returns (Child[] memory) {
        return _activeChildren[parentId];
    }

    // Show single active child of a parent
    function childOf(
        uint256 parentId,
        uint256 childIndex
    ) public view virtual returns (Child memory) {
        require(
            childrensOf(parentId).length >= childIndex,
            "Pending Child Index Out Of Range !"
        );

        return _activeChildren[parentId][childIndex];
    }

    // Show which child is active or not
    function childIsInActive(
        address childAddress,
        uint256 childId
    ) public view virtual returns (bool) {
        return _childIsInActive[childAddress][childId] != 0;
    }

    // Show indexing id of a child to pending child list
    function getPendingChildIndex(uint childId) public view returns (uint) {
        return _pendingChildIndex[childId];
    }

    // Show indexing id of a child to active child list
    function getActiveChildIndex(uint childId) public view returns (uint) {
        return _activeChildIndex[childId];
    }

    // show parent id of a child
    function getParentOfChild(uint childId) public view returns (uint) {
        return _parentOfChild[childId];
    }

    // ======================================================================================================== //
    //                                             Write Methods                                                //                                        //
    //                                                                                                          //
    // mint: mint parent nft and child nft.                                                                     //
    // nestMint: mint child nft and put under parent.                                                           //
    // addChild: mint child put under parent                                                                    //
    // acceptChild: accept pending childs buy parent nft owner                                                  //
    // transferChild: transfer child to new parent                                                              //
    // rejectAllChildren: remove all child of the parent                                                        //
    // burn: remove/delete minted parent nft and also its child and grand child                                 //
    // ======================================================================================================== //

    // mint parent nft and child nft.
    function mint(address _to, string memory _tokenURI) external {
        _innermint(_to, _tokenURI);
    }

    // mint child nft and put under parent.
    function nestMint(uint _parentId, string memory _tokenURI) external {
        _innermint(msg.sender, _tokenURI);

        _addChild(_parentId, totalNFT);
    }

    // mint child put under parent
    function addChild(
        uint256 _parentId,
        uint256 _childId
    ) external onlyNftOwner(_childId) {
        _addChild(_parentId, _childId);
    }

    // accept pending childs buy parent nft owner
    function acceptChild(
        uint256 _parentId,
        uint256 _childIndex,
        address _childAddress,
        uint256 _childId
    )
        external
        // check child already accepted or not
        onlyNftOwner(_parentId)
    {
        require(
            _childIsInActive[_childAddress][_childId] != 1,
            "Child Already Accepted!"
        );

        // check child is exits on pending child list or not
        require(
            _existsChildId(_parentId, _childIndex, _childId, true),
            "Detail not Found!"
        );

        require(
            _pendingChildren[_parentId][_childIndex].childAddress ==
                _childAddress,
            "Child Address not Matched!"
        );

        // check as per child Id child address matched or not.
        require(
            _pendingChildren[_parentId][_childIndex].childAddress ==
                _childAddress,
            "Child Address not Matched!"
        );

        _acceptChild(_parentId, _childIndex, _childAddress, _childId);
    }

    // transfer child to new parent
    function transferChild(
        uint256 _parentId,
        uint256 _newParentId,
        uint256 _childIndex,
        uint256 _childId,
        bool _isPending
    ) external virtual onlyNftOwner(_parentId) {
        // check new parent id and child id same or not
        _matchedId(_newParentId, _childId);

        require(
            _existsChildId(_parentId, _childIndex, _childId, _isPending),
            "Detail not Found!"
        );

        _transferChild(
            _parentId,
            _newParentId,
            _childIndex,
            _childId,
            _isPending
        );
    }

    // remove all pending/active child of the parent
    function rejectAllChildren(
        uint256 _parentId,
        bool _isPending
    ) external onlyNftOwner(_parentId) {
        // check already added or not
        _exitsParent(_parentId);
        _rejectAllChildren(_parentId, _isPending);
    }

    // remove all single or multiple pending/active child of the parent
    function rejectChilds(
        uint256 _parentId,
        uint256[] memory childIds,
        bool _isPending
    ) external onlyNftOwner(_parentId) {
        // check already added or not
        _exitsParent(_parentId);

        _rejectChilds(_parentId, childIds, _isPending);
    }

    // remove/delete minted parent nft and also its child and grand child
    function burn(uint256 parentId) external virtual onlyNftOwner(parentId) {
        require(
            pendingChildrensOf(parentId).length == 0 &&
                childrensOf(parentId).length == 0,
            "This Parent has Child!"
        );

        _exitsParent(parentId);

        return _burn(parentId);
    }

    // =======================================================================================================  //
    //                                         Private Methods                                                  //
    //                                                                                                          //
    // _existsId: check child or parent are exits or not                                                        //
    // _existsChildId: check child are exits in pending and accept child list.                                  //
    // _innermint: minting child/parent and stored nft id and nft owner address.                                //
    // _addChild: and also store child indexing and parent of child.                                            //
    // _acceptChild: and added to accept child list.                                                            //
    // _removeChildByIndex: remove single child in pending child list.                                          //
    // _transferChild: and remove child previous detail.                                                        //
    // _rejectAllChildren: remove all child in the parent                                                       //
    // _burn: delete parent and its child and also grand child for both list pending and accept.                //
    // _recursiveBurn: delete childs and grand child into pending child list.                                   //
    // _recursiveBurnActiveChild: delete childs and grand child into accept child list.                         //
    // =======================================================================================================  //

    // check child or parent are exits or not
    function _existsId(uint256 parentId) private view returns (bool) {
        return _directOwners[parentId].ownerAddress != address(0);
    }

    // check child are exits in pending and accept child list.
    function _existsChildId(
        uint256 _parentId,
        uint256 _childIndex,
        uint256 _childId,
        bool _isPending
    ) private view returns (bool) {
        if (_isPending) {
            return _pendingChildren[_parentId][_childIndex].childId == _childId;
        } else {
            return _activeChildren[_parentId][_childIndex].childId == _childId;
        }
    }

    // check child or parent are exits or not
    function _matchedId(uint256 _parentId, uint _childId) private pure {
        require(_parentId != _childId, "Parent and child Id same!");
    }

    // check child has parent exits or not
    function _exitsParent(uint _childId) private view {
        require(
            _parentOfChild[_childId] == 0,
            "Child already added in Parent!"
        );
    }

    // minting child/parent and stored nft id and nft owner address.
    function _innermint(address _to, string memory _tokenURI) private {
        uint256 nftId = nfttoken.mint(_to, _tokenURI);

        totalNFT++;
        _directOwners[totalNFT] = DirectOwner({
            nftId: nftId,
            ownerAddress: _to
        });

        emit Mint(nftId, _to);
    }

    // add child into the parent and also in parent pending child list,
    // and also store child indexing and parent of child.
    function _addChild(uint256 _parentId, uint256 _childId) private {
        // check parent and child are same or not
        _matchedId(_parentId, _childId);

        // check parent / child exits or not
        require(_existsId(_parentId), "Parent Not Found!");

        // check parent or child already added or not
        _exitsParent(_childId);
        _exitsParent(_parentId);

        // get child address by child id
        DirectOwner memory d1 = _directOwners[_childId];
        Child memory child = Child({
            childId: _childId,
            childAddress: d1.ownerAddress
        });

        // add pending child and nft transfer to the current contract address
        _pendingChildren[_parentId].push(child);

        // store parent id of child
        _parentOfChild[_childId] = _parentId;

        // store parent indexing
        uint index = _pendingChildren[_parentId].length - 1;
        _pendingChildIndex[_childId] = index;

        nfttoken.safeTransferFrom(d1.ownerAddress, address(this), d1.nftId);

        emit ChildProposed(_parentId, index, d1.ownerAddress, _childId);
    }

    // accept child by parent nft owner and remove child into pending child list,
    // and added to accept child list.
    function _acceptChild(
        uint256 _parentId,
        uint256 _childIndex,
        address _childAddress,
        uint256 _childId
    ) private {
        // transfering pending child to active child list
        Child memory child = pendingChildOf(_parentId, _childIndex);
        _activeChildren[_parentId].push(child);
        _childIsInActive[_childAddress][_childId] = 1; // We use 1 as true

        uint index = _activeChildren[_parentId].length - 1;
        _activeChildIndex[_childId] = index;

        nfttoken.safeTransferFrom(
            address(this),
            _directOwners[_parentId].ownerAddress,
            _directOwners[_childId].nftId
        );

        _removeChildByIndex(_pendingChildren[_parentId], _childIndex, true);

        delete _pendingChildIndex[_childId];
        emit ChildAccepted(_parentId, index, _childAddress, _childId);
    }

    // remove single child in pending child list.
    function _removeChildByIndex(
        Child[] storage array,
        uint256 _childIndex,
        bool _isPending
    ) private {
        array[_childIndex] = array[array.length - 1];

        // remove child index and last index value of child updated into deleted child index
        uint updateIndex = array[array.length - 1].childId;
        if (_isPending) {
            _pendingChildIndex[updateIndex] = _childIndex;
        } else {
            _activeChildIndex[updateIndex] = _childIndex;
        }

        array.pop();
    }

    // transfer child to another parent and added child detail into new parent list,
    // and remove child previous detail.
    function _transferChild(
        uint256 _parentId,
        uint256 _newParentId,
        uint256 _childIndex,
        uint256 _childId,
        bool _isPending
    ) private {
        // remove child to before parrent
        // add child in new parent detail
        Child memory child;
        if (_isPending) {
            child = pendingChildOf(_parentId, _childIndex);
            _removeChildByIndex(
                _pendingChildren[_parentId],
                _childIndex,
                _isPending
            );
            _pendingChildren[_newParentId].push(child);
        } else {
            child = childOf(_parentId, _childIndex);
            _removeChildByIndex(
                _activeChildren[_parentId],
                _childIndex,
                _isPending
            );
            _activeChildren[_newParentId].push(child);

            nfttoken.safeTransferFrom(
                msg.sender,
                _directOwners[_newParentId].ownerAddress,
                _directOwners[_childId].nftId
            );
        }

        _parentOfChild[_childId] = _parentId;

        emit ChildTransferred(
            _parentId,
            _newParentId,
            _childIndex,
            child.childAddress,
            _childId,
            _isPending
        );
    }

    // remove all child in the parent
    function _rejectAllChildren(uint256 _parentId, bool _isPending) private {
        // child is in pending list or not

        if (_isPending) {
            // transfer nft to child through contract address and delete child detail behalf of parent
            for (uint i = 0; i < _pendingChildren[_parentId].length; ) {
                Child memory c1 = _pendingChildren[_parentId][i];

                delete _parentOfChild[c1.childId];
                delete _pendingChildIndex[c1.childId];

                nfttoken.safeTransferFrom(
                    address(this),
                    c1.childAddress,
                    _directOwners[c1.childId].nftId
                );

                unchecked {
                    i++;
                }
            }
            delete _pendingChildren[_parentId];
        }
        // child is in active list or not
        else {
            // transfer nft to child through parent wallet and delete child detail behalf of parent
            for (uint j = 0; j < _activeChildren[_parentId].length; ) {
                Child memory c1 = _activeChildren[_parentId][j];

                delete _parentOfChild[c1.childId];
                delete _activeChildIndex[c1.childId];
                delete _childIsInActive[c1.childAddress][c1.childId];

                nfttoken.safeTransferFrom(
                    msg.sender,
                    c1.childAddress,
                    _directOwners[c1.childId].nftId
                );

                unchecked {
                    j++;
                }
            }

            delete _activeChildren[_parentId];
        }

        emit AllChildrenRejected(_parentId, msg.sender, _isPending);
    }

    function _rejectChilds(
        uint256 _parentId,
        uint256[] memory childIds,
        bool _isPending
    ) private {
        if (_isPending) {
            for (uint i = 0; i < childIds.length; ) {
                uint childIndex = getPendingChildIndex(childIds[i]);
                DirectOwner memory d1 = _directOwners[childIds[i]];

                // check child is exits on pending child list or not
                require(
                    _existsChildId(_parentId, childIndex, childIds[i], true),
                    "Detail not Found!"
                );

                // removed single child into pending child list
                _removeChildByIndex(
                    _pendingChildren[_parentId],
                    childIndex,
                    true
                );

                nfttoken.safeTransferFrom(
                    address(this),
                    d1.ownerAddress,
                    d1.nftId
                );

                delete _parentOfChild[childIds[i]];
                delete _pendingChildIndex[childIds[i]];

                unchecked {
                    i++;
                }
            }
        } else {
            for (uint j = 0; j < childIds.length; ) {
                uint childIndex = getActiveChildIndex(childIds[j]);
                DirectOwner memory d1 = _directOwners[childIds[j]];

                // check child is exits on active child list or not
                require(
                    _existsChildId(_parentId, childIndex, childIds[j], false),
                    "Detail not Found!"
                );

                // removed single child into pending child list
                _removeChildByIndex(
                    _activeChildren[_parentId],
                    childIndex,
                    false
                );

                nfttoken.safeTransferFrom(
                    msg.sender,
                    d1.ownerAddress,
                    d1.nftId
                );

                delete _parentOfChild[childIds[j]];
                delete _activeChildIndex[childIds[j]];
                delete _childIsInActive[d1.ownerAddress][childIds[j]];

                unchecked {
                    j++;
                }
            }
        }

        emit ChildsRejected(_parentId, msg.sender, childIds, _isPending);
    }

    // delete parent and its child and also grand child for both list pending and accept.
    function _burn(uint256 _parentId) private {
        delete _directOwners[_parentId];
        nfttoken.burn(_parentId);

        emit burning(_parentId, msg.sender);
    }
}
