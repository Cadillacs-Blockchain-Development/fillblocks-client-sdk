// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AcademicJourneyNFT is ERC721, ERC721URIStorage, Ownable {
    
    Counters.Counter private _tokenIdCounter;
    
    mapping(uint256 => AcademicSnapshot) public snapshots;
    
    mapping(address => uint256) public studentToLatestNFT;
    
    mapping(bytes32 => uint256[]) public uidToNFTs;
    
    mapping(address => bool) public authorizedMinters;
    
    event AcademicSnapshotMinted(
        uint256 indexed tokenId,
        address indexed student,
        string arweaveMetadataUri,
        bytes32 merkleRoot,
        uint256 timestamp
    );
    
    event UIDNFTCreated(
        uint256 indexed tokenId,
        bytes32 indexed studentUID,
        address indexed student,
        bytes32 merkleRoot,
        uint256 timestamp
    );
    
    event AuthorizedMinterUpdated(address indexed minter, bool authorized);
    
    struct AcademicSnapshot {
        string arweaveMetadataUri;    
        uint256 timestamp;            
        bytes32 merkleRoot;          
        string[] credentialIds;      
        address institution;         
        string academicLevel;        
        string fieldOfStudy;         
        uint256 graduationDate;      
        bytes32 studentUID;          
    }
   
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up snapshot data
        delete snapshots[tokenId];
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
