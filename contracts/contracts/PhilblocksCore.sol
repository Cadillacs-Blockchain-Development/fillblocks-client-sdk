// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PhilBlocksUID.sol";
import "./AcademicJourneyNFT.sol";

contract PhilBlocksCore {
    // Contract addresses
    PhilBlocksUID public uidContract;
    AcademicJourneyNFT public nftContract;
    address public uidProxyContract; // Optional proxy for wallet management
    
    // UID-based student profiles
    mapping(bytes32 => StudentProfile) public studentProfiles;
    mapping(bytes32 => uint256[]) public studentNFTs; // UID -> NFT token IDs
    
    // Student-specific merkle root anchoring
    mapping(bytes32 => StudentMerkleAnchor) public studentMerkleAnchors;
    mapping(bytes32 => bool) public anchoredStudentMerkleRoots;
    
    // Batch-level tracking for efficiency
    mapping(string => BatchInfo) public batchInfo;
    
    // Events
    event StudentMerkleRootAnchored(
        bytes32 indexed merkleRoot,
        bytes32 indexed studentUID,
        string batchId,
        string arweaveTxId,
        uint256 timestamp
    );
    
    event AcademicSnapshotCreated(
        bytes32 indexed studentUID,
        uint256 indexed tokenId,
        bytes32 indexed merkleRoot,
        string arweaveUri
    );
    
    event StudentProfileUpdated(
        bytes32 indexed studentUID,
        address indexed wallet,
        bool isActive
    );
    
    // Structs
    struct StudentProfile {
        bytes32 uidHash;
        address currentWallet; // Optional - can be updated
        bool isActive;
        uint256 createdAt;
        uint256 lastUpdated;
    }
    
    struct StudentMerkleAnchor {
        bytes32 merkleRoot;
        bytes32 uidHash;        // Student identifier
        string arweaveTxId;     // Student's credential data on Arweave
        address institution;
        uint256 timestamp;
        string[] credentialIds; // Student's specific credentials
    }
    
    struct BatchInfo {
        string batchId;
        bytes32 batchMerkleRoot; // Root of all student merkle roots in batch
        bytes32[] studentUIDs;
        address institution;
        uint256 timestamp;
    }
    
    /**
     * @dev Constructor
     * @param _uidContract Address of the UID contract
     * @param _nftContract Address of the NFT contract
     * @param _uidProxyContract Address of the UID proxy contract (optional)
     */
    constructor(address _uidContract, address _nftContract, address _uidProxyContract) {
        require(_uidContract != address(0), "Invalid UID contract address");
        require(_nftContract != address(0), "Invalid NFT contract address");
        
        uidContract = PhilBlocksUID(_uidContract);
        nftContract = AcademicJourneyNFT(_nftContract);
        uidProxyContract = _uidProxyContract; // Can be address(0) if not using proxy
    }
    
    /**
     * @dev Update student's current wallet address
     * @param studentUID UID hash of the student
     * @param newWallet New wallet address (can be address(0) to remove wallet)
     */
    function updateStudentWallet(bytes32 studentUID, address newWallet) external {
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        
        // Verify caller is authorized (student or institution)
        require(
            msg.sender == getCurrentWallet(studentUID) || 
            uidContract.isAuthorizedInstitution(msg.sender),
            "Not authorized to update wallet"
        );
        
        // Update or create student profile
        if (studentProfiles[studentUID].uidHash == bytes32(0)) {
            // Create new profile
            studentProfiles[studentUID] = StudentProfile({
                uidHash: studentUID,
                currentWallet: newWallet,
                isActive: true,
                createdAt: block.timestamp,
                lastUpdated: block.timestamp
            });
        } else {
            // Update existing profile
            studentProfiles[studentUID].currentWallet = newWallet;
            studentProfiles[studentUID].lastUpdated = block.timestamp;
        }
        
        emit StudentProfileUpdated(studentUID, newWallet, true);
    }
    
    /**
     * @dev Create a complete academic snapshot with UID verification and NFT minting
     * @param studentUID UID hash of the student
     * @param metadataUri URI pointing to Arweave metadata
     * @param merkleRoot Student's merkle root of credentials
     * @param credentialIds Array of credential IDs for this student
     * @param institution Address of the issuing institution
     * @param academicLevel Academic level achieved
     * @param fieldOfStudy Field of study
     * @param graduationDate Graduation date
     * @return tokenId ID of the minted NFT
     */
    function createAcademicSnapshot(
        bytes32 studentUID,
        string memory metadataUri,
        bytes32 merkleRoot,
        string[] memory credentialIds,
        address institution,
        string memory academicLevel,
        string memory fieldOfStudy,
        uint256 graduationDate
    ) external returns (uint256 tokenId) {
        // Verify UID exists
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        
        // Verify student-specific merkle root is anchored
        require(anchoredStudentMerkleRoots[merkleRoot], "Student merkle root not anchored");
        require(studentMerkleAnchors[merkleRoot].uidHash == studentUID, "Merkle root doesn't belong to student");
        
        // Get current wallet for NFT recipient
        address nftRecipient = getCurrentWallet(studentUID);
        require(nftRecipient != address(0), "No wallet associated with student UID");
        
        // Mint academic NFT with UID tracking
        tokenId = nftContract.mintAcademicSnapshotWithUID(
            nftRecipient,
            studentUID,
            metadataUri,
            merkleRoot,
            credentialIds,
            institution,
            academicLevel,
            fieldOfStudy,
            graduationDate
        );
        
        // Track NFT ownership by UID
        studentNFTs[studentUID].push(tokenId);
        
        emit AcademicSnapshotCreated(studentUID, tokenId, merkleRoot, metadataUri);
    }
    
    
    /**
     * @dev Get student profile information
     * @param studentUID UID hash of the student
     * @return profile Student profile information
     */
    function getStudentProfile(bytes32 studentUID) external view returns (StudentProfile memory profile) {
        profile = studentProfiles[studentUID];
        require(profile.uidHash != bytes32(0), "Student profile not found");
    }
    
    /**
     * @dev Get student merkle anchor information
     * @param merkleRoot Merkle root to query
     * @return Anchor information
     */
    function getStudentMerkleAnchor(bytes32 merkleRoot) external view returns (StudentMerkleAnchor memory) {
        require(anchoredStudentMerkleRoots[merkleRoot], "Student merkle root not anchored");
        return studentMerkleAnchors[merkleRoot];
    }
    
    /**
     * @dev Check if a student merkle root is anchored
     * @param merkleRoot Merkle root to check
     * @return True if anchored
     */
    function isStudentMerkleRootAnchored(bytes32 merkleRoot) external view returns (bool) {
        return anchoredStudentMerkleRoots[merkleRoot];
    }
    
    /**
     * @dev Get batch information
     * @param batchId Batch identifier
     * @return Batch information
     */
    function getBatchInfo(string memory batchId) external view returns (BatchInfo memory) {
        require(batchInfo[batchId].timestamp > 0, "Batch not found");
        return batchInfo[batchId];
    }
    
    /**
     * @dev Update contract addresses (only owner)
     * @param _uidContract New UID contract address
     * @param _nftContract New NFT contract address
     * @param _uidProxyContract New UID proxy contract address
     */
    function updateContractAddresses(
        address _uidContract,
        address _nftContract,
        address _uidProxyContract
    ) external {
        // This would typically be restricted to owner
        require(_uidContract != address(0), "Invalid UID contract address");
        require(_nftContract != address(0), "Invalid NFT contract address");
        
        uidContract = PhilBlocksUID(_uidContract);
        nftContract = AcademicJourneyNFT(_nftContract);
        uidProxyContract = _uidProxyContract;
    }
    
    /**
     * @dev Get current wallet address for a student UID
     * @param studentUID UID hash of the student
     * @return wallet Current wallet address (address(0) if no wallet set)
     */
    function getCurrentWallet(bytes32 studentUID) public view returns (address wallet) {
        // First check if proxy contract is set
        if (uidProxyContract != address(0)) {
            // Try to get wallet from proxy contract
            (bool success, bytes memory data) = uidProxyContract.staticcall(
                abi.encodeWithSignature("getCurrentWallet(bytes32)", studentUID)
            );
            if (success && data.length > 0) {
                wallet = abi.decode(data, (address));
            }
        }
        
        // Fallback to local student profile
        if (wallet == address(0)) {
            wallet = studentProfiles[studentUID].currentWallet;
        }
        
        return wallet;
    }
}
