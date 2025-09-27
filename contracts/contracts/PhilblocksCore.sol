// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./PhilBlocksUID.sol";
import "./AcademicJourneyNFT.sol";

contract PhilBlocksCore is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    // Contract addresses
    PhilBlocksUID public uidContract;
    AcademicJourneyNFT public nftContract;
    
    // Centralized role management events
    event CentralizedRoleGranted(bytes32 indexed role, address indexed account, string indexed contractName);
    event CentralizedRoleRevoked(bytes32 indexed role, address indexed account, string indexed contractName);
    
    // UID-based student profiles
    mapping(bytes32 => StudentProfile) public studentProfiles;
    mapping(bytes32 => uint256[]) public studentNFTs; // UID -> NFT token IDs
    
    // Dynamic data streaming for students
    mapping(bytes32 => StudentDataStream) public studentDataStreams;
    mapping(bytes32 => uint256) public studentDataUpdateCount; // Track number of updates per student
    mapping(bytes32 => mapping(uint256 => DataUpdate)) public studentDataUpdates; // studentUID => updateIndex => DataUpdate
    
    // Legacy merkle root anchoring (for final credentials/snapshots)
    mapping(bytes32 => StudentMerkleAnchor) public studentMerkleAnchors;
    mapping(bytes32 => bool) public anchoredStudentMerkleRoots;
    
    // Events

    event StudentDataUpdated(
        bytes32 indexed studentUID,
        uint256 indexed updateIndex,
        string dataType,
        string indexed arweaveTxId,
        uint256 timestamp
    );
    
    event StudentMerkleRootAnchored(
        bytes32 indexed merkleRoot,

        bytes32 indexed studentUID,
        string indexed arweaveTxId,
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
    
    // Admin events
    event ContractAddressesUpdated(
        address indexed uidContract,
        address indexed nftContract
    );
    
    event InstitutionRoleGranted(address indexed institution);
    event InstitutionRoleRevoked(address indexed institution);
    event UpdaterRoleGranted(address indexed updater);
    event UpdaterRoleRevoked(address indexed updater);
    
    // Structs

    struct StudentProfile {
        bytes32 uidHash;
        address currentWallet; // Optional - can be updated
        bool isActive;
        uint256 createdAt;
        uint256 lastUpdated;
    }
    
    struct StudentDataStream {
        bytes32 uidHash;           // Student identifier
        address institution;       // Issuing institution
        uint256 totalUpdates;      // Total number of data updates
        uint256 lastUpdateTime;    // Timestamp of last update
        string currentArweaveTxId; // Latest data location on Arweave
        bool isActive;             // Whether stream is active
    }
    
    struct DataUpdate {
        uint256 updateIndex;       // Sequential update number
        string dataType;           // Type of data (attendance, grades, assignments, etc.)
        string arweaveTxId;        // Location of this update's data on Arweave
        uint256 timestamp;         // When this update was made
        address institution;       // Institution that made the update
        bytes32 previousDataHash;  // Hash of previous data state
        bytes32 currentDataHash;   // Hash of current data state
    }
    
    struct StudentMerkleAnchor {
        bytes32 merkleRoot;

        bytes32 uidHash;        // Student identifier
        string arweaveTxId;     // Student's credential data on Arweave
        address institution;
        uint256 timestamp;

        string[] credentialIds; // Student's specific credentials
    }

    
    
    /**
     * @dev Constructor
     * @param _uidContract Address of the UID contract
     * @param _nftContract Address of the NFT contract
     * @param _admin Address of the admin (will be granted ADMIN_ROLE)
     */
    constructor(
        address _uidContract, 
        address _nftContract, 
        address _admin
    ) {
        require(_uidContract != address(0), "Invalid UID contract address");
        require(_nftContract != address(0), "Invalid NFT contract address");
        require(_admin != address(0), "Invalid admin address");
        
        uidContract = PhilBlocksUID(_uidContract);
        nftContract = AcademicJourneyNFT(_nftContract);

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        
        // Admin can grant other roles
        _setRoleAdmin(INSTITUTION_ROLE, ADMIN_ROLE);
        _setRoleAdmin(STUDENT_ROLE, ADMIN_ROLE);
        _setRoleAdmin(UPDATER_ROLE, ADMIN_ROLE);
    }
    
    /**
     * @dev Initialize all contracts and set up centralized role management
     * @param _verifierAddress Address of the ZK proof verifier contract
     * @param _admin Address of the admin (will be granted roles in all contracts)
     */
    function initializeAllContracts(
        address _verifierAddress,
        address _admin
    ) external onlyRole(ADMIN_ROLE) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        require(_admin != address(0), "Invalid admin address");
        
        // Initialize UID contract
        uidContract.initialize(_verifierAddress, _admin);
        
        // Set up centralized role management
        uidContract.setRoleManager(address(this));
        nftContract.setRoleManager(address(this));
        
        // Grant admin role to the specified admin in all contracts
        _grantRole(ADMIN_ROLE, _admin);
        uidContract.grantRole(ADMIN_ROLE, _admin);
        nftContract.grantRole(ADMIN_ROLE, _admin);
        
        emit CentralizedRoleGranted(ADMIN_ROLE, _admin, "PhilBlocksCore");
        emit CentralizedRoleGranted(ADMIN_ROLE, _admin, "PhilBlocksUID");
        emit CentralizedRoleGranted(ADMIN_ROLE, _admin, "AcademicJourneyNFT");
    }
    
    /**
     * @dev Initialize a student data stream for continuous updates
     * @param studentUID UID hash of the student
     * @param initialArweaveTxId Initial data location on Arweave
     */
    function initializeStudentDataStream(
        bytes32 studentUID,
        string memory initialArweaveTxId
    ) external whenNotPaused onlyRole(INSTITUTION_ROLE) {
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        require(bytes(initialArweaveTxId).length > 0, "Empty Arweave transaction ID");
        require(!studentDataStreams[studentUID].isActive, "Data stream already initialized");
        
        studentDataStreams[studentUID] = StudentDataStream({
            uidHash: studentUID,
            institution: msg.sender,
            totalUpdates: 0,
            lastUpdateTime: block.timestamp,
            currentArweaveTxId: initialArweaveTxId,
            isActive: true
        });
        
        studentDataUpdateCount[studentUID] = 0;
        
        emit StudentDataUpdated(studentUID, 0, "INITIALIZATION", initialArweaveTxId, block.timestamp);
    }
    
    /**
     * @dev Update student data stream with new information
     * @param studentUID UID hash of the student
     * @param dataType Type of data being updated (attendance, grades, assignments, etc.)
     * @param arweaveTxId Location of updated data on Arweave
     * @param previousDataHash Hash of previous data state
     * @param currentDataHash Hash of current data state
     */
    function updateStudentData(
        bytes32 studentUID,
        string memory dataType,
        string memory arweaveTxId,
        bytes32 previousDataHash,
        bytes32 currentDataHash
    ) external whenNotPaused onlyRole(UPDATER_ROLE) {
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        require(studentDataStreams[studentUID].isActive, "Student data stream not initialized");
        require(bytes(dataType).length > 0, "Empty data type");
        require(bytes(arweaveTxId).length > 0, "Empty Arweave transaction ID");
        require(
            msg.sender == studentDataStreams[studentUID].institution || 
            uidContract.isAuthorizedInstitution(msg.sender),
            "Not authorized to update student data"
        );
        
        uint256 updateIndex = studentDataUpdateCount[studentUID] + 1;
        
        // Store the data update
        studentDataUpdates[studentUID][updateIndex] = DataUpdate({
            updateIndex: updateIndex,
            dataType: dataType,
            arweaveTxId: arweaveTxId,
            timestamp: block.timestamp,
            institution: msg.sender,
            previousDataHash: previousDataHash,
            currentDataHash: currentDataHash
        });
        
        // Update stream information
        studentDataStreams[studentUID].totalUpdates = updateIndex;
        studentDataStreams[studentUID].lastUpdateTime = block.timestamp;
        studentDataStreams[studentUID].currentArweaveTxId = arweaveTxId;
        
        studentDataUpdateCount[studentUID] = updateIndex;
        
        emit StudentDataUpdated(studentUID, updateIndex, dataType, arweaveTxId, block.timestamp);
    }
    
    /**
     * @dev Anchor a student-specific merkle root for data integrity (for final credentials/snapshots)
     * @param merkleRoot Student's merkle root to anchor
     * @param studentUID UID hash of the student
     * @param arweaveTxId Arweave transaction ID containing student's credentials
     * @param credentialIds Array of credential IDs for this student
     */
    function anchorStudentMerkleRoot(
        bytes32 merkleRoot,

        bytes32 studentUID,
        string memory arweaveTxId,

        string[] memory credentialIds
    ) external whenNotPaused onlyRole(INSTITUTION_ROLE) {
        require(!anchoredStudentMerkleRoots[merkleRoot], "Student merkle root already anchored");
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        require(bytes(arweaveTxId).length > 0, "Empty Arweave transaction ID");

        require(credentialIds.length > 0, "No credential IDs provided");
        

        studentMerkleAnchors[merkleRoot] = StudentMerkleAnchor({
            merkleRoot: merkleRoot,

            uidHash: studentUID,
            arweaveTxId: arweaveTxId,
            institution: msg.sender,
            timestamp: block.timestamp,

            credentialIds: credentialIds
        });
        
        anchoredStudentMerkleRoots[merkleRoot] = true;
        
        emit StudentMerkleRootAnchored(merkleRoot, studentUID, arweaveTxId, block.timestamp);
    }
    
    /**
     * @dev Update student's current wallet address
     * @param studentUID UID hash of the student
     * @param newWallet New wallet address (can be address(0) to remove wallet)
     */
    function updateStudentWallet(bytes32 studentUID, address newWallet) external whenNotPaused {
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");

        // Verify caller is authorized (student themselves, institution, or admin)
        require(
            msg.sender == getCurrentWallet(studentUID) ||
            uidContract.isAuthorizedInstitution(msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
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

    ) external whenNotPaused returns (uint256 tokenId) {
        // Verify UID exists
        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        
        // Verify caller is authorized (student themselves, institution, or admin)
        address currentWallet = getCurrentWallet(studentUID);
        require(
            msg.sender == currentWallet ||
            uidContract.isAuthorizedInstitution(msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to create academic snapshot"
        );
        
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

     * @dev Verify a credential using UID-based verification
     * @param studentUID UID hash of the student
     * @param credentialId ID of the credential to verify
     * @return verified True if credential is verified
     * @return tokenId ID of the NFT containing the credential
     */
    function verifyCredentialWithUID(

        bytes32 studentUID,
        string memory credentialId
    ) external view returns (bool verified, uint256 tokenId) {
        // Check if student has UID

        require(uidContract.registeredUIDs(studentUID), "Student UID not registered");
        
        // Get student's latest NFT

        uint256[] memory studentNFTList = studentNFTs[studentUID];
        require(studentNFTList.length > 0, "Student has no academic NFTs");
        
        tokenId = studentNFTList[studentNFTList.length - 1]; // Get latest NFT
        
        // Verify credential in NFT
        verified = nftContract.verifyCredential(tokenId, credentialId);
    }
    
    /**

     * @dev Get complete academic profile for a student by UID
     * @param studentUID UID hash of the student
     * @return uidHash Hash of the student's UID
     * @return tokenIds Array of NFT token IDs
     * @return hasActiveUID True if student has active UID

     * @return currentWallet Current wallet address associated with UID
     */
    function getStudentAcademicProfile(

        bytes32 studentUID
    ) external view returns (
        bytes32 uidHash,
        uint256[] memory tokenIds,

        bool hasActiveUID,
        address currentWallet
    ) {
        uidHash = studentUID;
        tokenIds = studentNFTs[studentUID];
        hasActiveUID = uidContract.registeredUIDs(studentUID);
        currentWallet = getCurrentWallet(studentUID);
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
     * @dev Get student data stream information
     * @param studentUID UID hash of the student
     * @return Student data stream information
     */
    function getStudentDataStream(bytes32 studentUID) external view returns (StudentDataStream memory) {
        require(studentDataStreams[studentUID].isActive, "Student data stream not found");
        return studentDataStreams[studentUID];
    }
    
    /**
     * @dev Get a specific data update for a student
     * @param studentUID UID hash of the student
     * @param updateIndex Index of the update to retrieve
     * @return Data update information
     */
    function getStudentDataUpdate(bytes32 studentUID, uint256 updateIndex) external view returns (DataUpdate memory) {
        require(studentDataStreams[studentUID].isActive, "Student data stream not found");
        require(updateIndex > 0 && updateIndex <= studentDataUpdateCount[studentUID], "Invalid update index");
        return studentDataUpdates[studentUID][updateIndex];
    }
    
    /**
     * @dev Get all data updates for a student within a range
     * @param studentUID UID hash of the student
     * @param startIndex Starting index (inclusive)
     * @param endIndex Ending index (inclusive)
     * @return Array of data updates
     */
    function getStudentDataUpdatesRange(
        bytes32 studentUID, 
        uint256 startIndex, 
        uint256 endIndex
    ) external view returns (DataUpdate[] memory) {
        require(studentDataStreams[studentUID].isActive, "Student data stream not found");
        require(startIndex > 0 && endIndex <= studentDataUpdateCount[studentUID], "Invalid range");
        require(startIndex <= endIndex, "Start index must be <= end index");
        
        uint256 length = endIndex - startIndex + 1;
        DataUpdate[] memory updates = new DataUpdate[](length);
        
        for (uint256 i = 0; i < length; i++) {
            updates[i] = studentDataUpdates[studentUID][startIndex + i];
        }
        
        return updates;
    }
    
    /**
     * @dev Get all data updates for a student by data type
     * @param studentUID UID hash of the student
     * @param dataType Type of data to filter by
     * @return Array of data updates matching the type
     */
    function getStudentDataUpdatesByType(
        bytes32 studentUID, 
        string memory dataType
    ) external view returns (DataUpdate[] memory) {
        require(studentDataStreams[studentUID].isActive, "Student data stream not found");
        
        uint256 totalUpdates = studentDataUpdateCount[studentUID];
        DataUpdate[] memory tempUpdates = new DataUpdate[](totalUpdates);
        uint256 matchCount = 0;
        
        // First pass: count matches
        for (uint256 i = 1; i <= totalUpdates; i++) {
            DataUpdate memory update = studentDataUpdates[studentUID][i];
            if (keccak256(abi.encodePacked(update.dataType)) == keccak256(abi.encodePacked(dataType))) {
                tempUpdates[matchCount] = update;
                matchCount++;
            }
        }
        
        // Second pass: create properly sized array
        DataUpdate[] memory matchingUpdates = new DataUpdate[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            matchingUpdates[i] = tempUpdates[i];
        }
        
        return matchingUpdates;
    }
    
    /**
     * @dev Get latest data update for a student
     * @param studentUID UID hash of the student
     * @return Latest data update information
     */
    function getLatestStudentDataUpdate(bytes32 studentUID) external view returns (DataUpdate memory) {
        require(studentDataStreams[studentUID].isActive, "Student data stream not found");
        uint256 latestIndex = studentDataUpdateCount[studentUID];
        require(latestIndex > 0, "No data updates found");
        return studentDataUpdates[studentUID][latestIndex];
    }
    
    /**
     * @dev Get total number of data updates for a student
     * @param studentUID UID hash of the student
     * @return Total number of updates
     */
    function getStudentDataUpdateCount(bytes32 studentUID) external view returns (uint256) {
        return studentDataUpdateCount[studentUID];
    }
    
    
    /**
     * @dev Update contract addresses (admin only)
     * @param _uidContract New UID contract address
     * @param _nftContract New NFT contract address

     */
    function updateContractAddresses(
        address _uidContract,
        address _nftContract
    ) external onlyRole(ADMIN_ROLE) {
        require(_uidContract != address(0), "Invalid UID contract address");
        require(_nftContract != address(0), "Invalid NFT contract address");
        
        uidContract = PhilBlocksUID(_uidContract);
        nftContract = AcademicJourneyNFT(_nftContract);

        
        emit ContractAddressesUpdated(_uidContract, _nftContract);
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
     * @dev Grant updater role to an address (admin only)
     * @param updater Address to grant updater role
     */
    function grantUpdaterRole(address updater) external onlyRole(ADMIN_ROLE) {
        require(updater != address(0), "Invalid updater address");
        _grantRole(UPDATER_ROLE, updater);
        emit UpdaterRoleGranted(updater);
    }
    
    /**
     * @dev Revoke updater role from an address (admin only)
     * @param updater Address to revoke updater role
     */
    function revokeUpdaterRole(address updater) external onlyRole(ADMIN_ROLE) {
        _revokeRole(UPDATER_ROLE, updater);
        emit UpdaterRoleRevoked(updater);
    }
    
    // ============ CENTRALIZED ROLE MANAGEMENT ============
    
    /**
     * @dev Grant role across all contracts (admin only)
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRoleAcrossAllContracts(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");
        
        // Grant role in Core contract
        _grantRole(role, account);
        emit CentralizedRoleGranted(role, account, "PhilBlocksCore");
        
        // Grant role in UID contract
        if (address(uidContract) != address(0)) {
            uidContract.grantRole(role, account);
            emit CentralizedRoleGranted(role, account, "PhilBlocksUID");
        }
        
        // Grant role in NFT contract
        if (address(nftContract) != address(0)) {
            nftContract.grantRole(role, account);
            emit CentralizedRoleGranted(role, account, "AcademicJourneyNFT");
        }
    }
    
    /**
     * @dev Revoke role across all contracts (admin only)
     * @param role Role to revoke
     * @param account Address to revoke role from
     */
    function revokeRoleAcrossAllContracts(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        // Revoke role in Core contract
        _revokeRole(role, account);
        emit CentralizedRoleRevoked(role, account, "PhilBlocksCore");
        
        // Revoke role in UID contract
        if (address(uidContract) != address(0)) {
            uidContract.revokeRole(role, account);
            emit CentralizedRoleRevoked(role, account, "PhilBlocksUID");
        }
        
        // Revoke role in NFT contract
        if (address(nftContract) != address(0)) {
            nftContract.revokeRole(role, account);
            emit CentralizedRoleRevoked(role, account, "AcademicJourneyNFT");
        }
    }
    
    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get current wallet address for a student UID
     * @param studentUID UID hash of the student
     * @return wallet Current wallet address (address(0) if no wallet set)
     */
    function getCurrentWallet(bytes32 studentUID) public view returns (address wallet) {
        return studentProfiles[studentUID].currentWallet;
    }
    
    // ============ CONVENIENCE FUNCTIONS FOR CENTRALIZED ROLE MANAGEMENT ============
    
    /**
     * @dev Grant institution role across all contracts (admin only)
     * @param institution Address to grant institution role
     */
    function grantInstitutionRoleAcrossAllContracts(address institution) external onlyRole(ADMIN_ROLE) {
        grantRoleAcrossAllContracts(INSTITUTION_ROLE, institution);
    }
    
    /**
     * @dev Revoke institution role across all contracts (admin only)
     * @param institution Address to revoke institution role
     */
    function revokeInstitutionRoleAcrossAllContracts(address institution) external onlyRole(ADMIN_ROLE) {
        revokeRoleAcrossAllContracts(INSTITUTION_ROLE, institution);
    }
    
    /**
     * @dev Grant student role across all contracts (admin only)
     * @param student Address to grant student role
     */
    function grantStudentRoleAcrossAllContracts(address student) external onlyRole(ADMIN_ROLE) {
        grantRoleAcrossAllContracts(STUDENT_ROLE, student);
    }
    
    /**
     * @dev Revoke student role across all contracts (admin only)
     * @param student Address to revoke student role
     */
    function revokeStudentRoleAcrossAllContracts(address student) external onlyRole(ADMIN_ROLE) {
        revokeRoleAcrossAllContracts(STUDENT_ROLE, student);
    }
    
    /**
     * @dev Grant updater role across all contracts (admin only)
     * @param updater Address to grant updater role
     */
    function grantUpdaterRoleAcrossAllContracts(address updater) external onlyRole(ADMIN_ROLE) {
        grantRoleAcrossAllContracts(UPDATER_ROLE, updater);
    }
    
    /**
     * @dev Revoke updater role across all contracts (admin only)
     * @param updater Address to revoke updater role
     */
    function revokeUpdaterRoleAcrossAllContracts(address updater) external onlyRole(ADMIN_ROLE) {
        revokeRoleAcrossAllContracts(UPDATER_ROLE, updater);
    }
}

