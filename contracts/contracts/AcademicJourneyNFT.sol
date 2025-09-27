// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract AcademicJourneyNFT is ERC721, ERC721URIStorage, AccessControl {
    
    // Token ID counter
    uint256 private _tokenIdCounter;
    
    // Mapping of token ID to academic snapshot data
    mapping(uint256 => AcademicSnapshot) public snapshots;
    
    // Mapping of student address to their latest NFT (legacy support)
    mapping(address => uint256) public studentToLatestNFT;
    
    // Mapping of UID to their NFTs for UID-centric operations
    mapping(bytes32 => uint256[]) public uidToNFTs;
    
    // Centralized role management
    address public roleManager; // PhilBlocksCore address
    
    // Role definitions (consistent with PhilBlocksCore and PhilBlocksUID)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    // Events
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
    
    event InstitutionRoleGranted(address indexed institution);
    event InstitutionRoleRevoked(address indexed institution);
    
    // Structs
    struct AcademicSnapshot {
        string arweaveMetadataUri;    // URI pointing to Arweave metadata
        uint256 timestamp;            // Timestamp of snapshot creation
        bytes32 merkleRoot;           // Merkle root of credentials
        string[] credentialIds;       // Array of credential IDs
        address institution;          // Issuing institution
        string academicLevel;         // Academic level (e.g., "Bachelor", "Master")
        string fieldOfStudy;          // Field of study
        uint256 graduationDate;       // Graduation date
        bytes32 studentUID;           // Student UID hash (added for UID-centric operations)
    }
    
    /**
     * @dev Constructor
     * @param name Name of the NFT collection
     * @param symbol Symbol of the NFT collection
     * @param _admin Address of the admin (will be granted DEFAULT_ADMIN_ROLE)
     */
    constructor(
        string memory name,
        string memory symbol,
        address _admin
    ) ERC721(name, symbol) {
        require(_admin != address(0), "Invalid admin address");
        
        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        
        // Admin can grant other roles
        _setRoleAdmin(INSTITUTION_ROLE, ADMIN_ROLE);
        _setRoleAdmin(STUDENT_ROLE, ADMIN_ROLE);
        _setRoleAdmin(UPDATER_ROLE, ADMIN_ROLE);
    }
    
    /**
     * @dev Set role manager (PhilBlocksCore) - can only be called once by admin
     * @param _roleManager Address of the role manager contract
     */
    function setRoleManager(address _roleManager) external onlyRole(ADMIN_ROLE) {
        require(_roleManager != address(0), "Invalid role manager address");
        require(roleManager == address(0), "Role manager already set");
        roleManager = _roleManager;
        
        // Grant role manager the ability to grant roles
        _grantRole(ADMIN_ROLE, _roleManager);
    }
    
    /**
     * @dev Mint a new academic journey NFT
     * @param student Address of the student
     * @param metadataUri URI pointing to Arweave metadata
     * @param merkleRoot Merkle root of the credentials
     * @param credentialIds Array of credential IDs
     * @param institution Address of the issuing institution
     * @param academicLevel Academic level achieved
     * @param fieldOfStudy Field of study
     * @param graduationDate Graduation date
     * @return tokenId ID of the minted NFT
     */
    function mintAcademicSnapshot(
        address student,
        string memory metadataUri,
        bytes32 merkleRoot,
        string[] memory credentialIds,
        address institution,
        string memory academicLevel,
        string memory fieldOfStudy,
        uint256 graduationDate
    ) external returns (uint256 tokenId) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(INSTITUTION_ROLE, msg.sender),
            "Not authorized to mint"
        );
        require(student != address(0), "Invalid student address");
        require(bytes(metadataUri).length > 0, "Empty metadata URI");
        require(credentialIds.length > 0, "No credentials provided");
        require(institution != address(0), "Invalid institution address");
        require(bytes(academicLevel).length > 0, "Empty academic level");
        require(bytes(fieldOfStudy).length > 0, "Empty field of study");
        require(graduationDate > 0, "Invalid graduation date");
        
        // Generate new token ID
        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create academic snapshot
        snapshots[tokenId] = AcademicSnapshot({
            arweaveMetadataUri: metadataUri,
            timestamp: block.timestamp,
            merkleRoot: merkleRoot,
            credentialIds: credentialIds,
            institution: institution,
            academicLevel: academicLevel,
            fieldOfStudy: fieldOfStudy,
            graduationDate: graduationDate,
            studentUID: bytes32(0) // Will be set by UID-based minting function
        });
        
        // Mint NFT to student
        _safeMint(student, tokenId);
        
        // Update student's latest NFT
        studentToLatestNFT[student] = tokenId;
        
        // Set token URI
        _setTokenURI(tokenId, metadataUri);
        
        emit AcademicSnapshotMinted(
            tokenId,
            student,
            metadataUri,
            merkleRoot,
            block.timestamp
        );
    }
    
    /**
     * @dev Mint a new academic journey NFT with UID tracking
     * @param student Address of the student
     * @param studentUID UID hash of the student
     * @param metadataUri URI pointing to Arweave metadata
     * @param merkleRoot Merkle root of the credentials
     * @param credentialIds Array of credential IDs
     * @param institution Address of the issuing institution
     * @param academicLevel Academic level achieved
     * @param fieldOfStudy Field of study
     * @param graduationDate Graduation date
     * @return tokenId ID of the minted NFT
     */
    function mintAcademicSnapshotWithUID(
        address student,
        bytes32 studentUID,
        string memory metadataUri,
        bytes32 merkleRoot,
        string[] memory credentialIds,
        address institution,
        string memory academicLevel,
        string memory fieldOfStudy,
        uint256 graduationDate
    ) external returns (uint256 tokenId) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(INSTITUTION_ROLE, msg.sender),
            "Not authorized to mint"
        );
        require(student != address(0), "Invalid student address");
        require(studentUID != bytes32(0), "Invalid student UID");
        require(bytes(metadataUri).length > 0, "Empty metadata URI");
        require(credentialIds.length > 0, "No credentials provided");
        require(institution != address(0), "Invalid institution address");
        require(bytes(academicLevel).length > 0, "Empty academic level");
        require(bytes(fieldOfStudy).length > 0, "Empty field of study");
        require(graduationDate > 0, "Invalid graduation date");
        
        // Generate new token ID
        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create academic snapshot with UID
        snapshots[tokenId] = AcademicSnapshot({
            arweaveMetadataUri: metadataUri,
            timestamp: block.timestamp,
            merkleRoot: merkleRoot,
            credentialIds: credentialIds,
            institution: institution,
            academicLevel: academicLevel,
            fieldOfStudy: fieldOfStudy,
            graduationDate: graduationDate,
            studentUID: studentUID
        });
        
        // Mint NFT to student
        _safeMint(student, tokenId);
        
        // Update student's latest NFT (legacy support)
        studentToLatestNFT[student] = tokenId;
        
        // Track NFT by UID
        uidToNFTs[studentUID].push(tokenId);
        
        // Set token URI
        _setTokenURI(tokenId, metadataUri);
        
        emit AcademicSnapshotMinted(
            tokenId,
            student,
            metadataUri,
            merkleRoot,
            block.timestamp
        );
        
        emit UIDNFTCreated(
            tokenId,
            studentUID,
            student,
            merkleRoot,
            block.timestamp
        );
    }
    
    /**
     * @dev Get academic snapshot data for a token
     * @param tokenId ID of the token
     * @return Academic snapshot data
     */
    function getAcademicSnapshot(uint256 tokenId) external view returns (AcademicSnapshot memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return snapshots[tokenId];
    }
    
    /**
     * @dev Get student's latest academic NFT
     * @param student Address of the student
     * @return tokenId ID of the latest NFT
     */
    function getStudentLatestNFT(address student) external view returns (uint256) {
        return studentToLatestNFT[student];
    }
    
    /**
     * @dev Get all NFTs owned by a student
     * @param student Address of the student
     * @return tokenIds Array of token IDs owned by the student
     */
    function getStudentNFTs(address student) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(student);
        uint256[] memory tokenIds = new uint256[](balance);
        
        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (ownerOf(i) == student) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get all NFTs for a student UID
     * @param studentUID UID hash of the student
     * @return tokenIds Array of token IDs for the student UID
     */
    function getUIDNFTs(bytes32 studentUID) external view returns (uint256[] memory) {
        return uidToNFTs[studentUID];
    }
    
    /**
     * @dev Get merkle root for a token
     * @param tokenId ID of the token
     * @return merkleRoot Merkle root of the token
     */
    function getMerkleRoot(uint256 tokenId) external view returns (bytes32) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return snapshots[tokenId].merkleRoot;
    }
    
    /**
     * @dev Verify if a credential is included in an NFT's merkle root
     * @param tokenId ID of the NFT
     * @param credentialId ID of the credential to verify
     * @return True if credential is included
     */
    function verifyCredential(uint256 tokenId, string memory credentialId) external view returns (bool) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        AcademicSnapshot memory snapshot = snapshots[tokenId];
        
        for (uint256 i = 0; i < snapshot.credentialIds.length; i++) {
            if (keccak256(abi.encodePacked(snapshot.credentialIds[i])) == 
                keccak256(abi.encodePacked(credentialId))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Grant institution role to an address (admin only)
     * @param institution Address to grant institution role
     */
    function grantInstitutionRole(address institution) external onlyRole(ADMIN_ROLE) {
        require(institution != address(0), "Invalid institution address");
        _grantRole(INSTITUTION_ROLE, institution);
        emit InstitutionRoleGranted(institution);
    }
    
    /**
     * @dev Revoke institution role from an address (admin only)
     * @param institution Address to revoke institution role
     */
    function revokeInstitutionRole(address institution) external onlyRole(ADMIN_ROLE) {
        _revokeRole(INSTITUTION_ROLE, institution);
        emit InstitutionRoleRevoked(institution);
    }
    
    /**
     * @dev Check if an address is an authorized minter
     * @param minter Address to check
     * @return True if authorized
     */
    function isAuthorizedMinter(address minter) external view returns (bool) {
        return hasRole(ADMIN_ROLE, minter) || hasRole(INSTITUTION_ROLE, minter);
    }
    
    /**
     * @dev Get total number of NFTs minted
     * @return Total count
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    // Note: _burn override removed due to OpenZeppelin version compatibility
    
    /**
     * @dev Override tokenURI to use ERC721URIStorage
     * @param tokenId ID of the token
     * @return URI of the token
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override supportsInterface
     * @param interfaceId Interface ID to check
     * @return True if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
