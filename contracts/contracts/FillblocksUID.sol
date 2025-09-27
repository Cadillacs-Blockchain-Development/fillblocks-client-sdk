// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract PhilBlocksUID is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using ECDSA for bytes32;
    
    // ZK Proof verifier contract
    IVerifier public verifier;
    
    // UID mappings
    mapping(bytes32 => bool) public registeredUIDs;
    mapping(bytes32 => UIDData) public uidData;
    mapping(address => bytes32) public addressToUID;
    
    // Recovery mappings
    mapping(bytes32 => RecoveryData) public recoveryData;
    mapping(bytes32 => bool) public pendingRecoveries;
    
    // Institution management
    mapping(address => bool) public authorizedInstitutions;
    mapping(bytes32 => address) public institutionUIDs;
    
    // Events
    event UIDRegistered(bytes32 indexed uidHash, address indexed user, uint256 timestamp);
    event RecoveryRequested(bytes32 indexed recoveryId, string recoveryMethod, uint256 timestamp);
    event RecoveryCompleted(bytes32 indexed uidHash, address indexed newAddress, uint256 timestamp);
    event InstitutionAuthorized(address indexed institution, bool authorized);
    
    // Structs
    struct UIDData {
        bytes32 uidHash;
        bytes32 institutionHash;
        uint256 registrationTimestamp;
        bool isActive;
        string arweaveMetadataUri;
        string recoveryMethod;
        bytes32 recoveryHash;
    }
    
    struct RecoveryData {
        bytes32 nationalIDHash;
        bytes32 salt;
        uint256 requestTimestamp;
        bool verified;
        string recoveryMethod; // "email", "phone", "biometric"
        address requester;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract with ZK verifier address
     * @param _verifier Address of the ZK proof verifier contract
     */
    function initialize(address _verifier) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        verifier = IVerifier(_verifier);
    }
    
    /**
     * @dev Register a new UID with zero-knowledge proof verification
     * @param uidHash Hash of the UID
     * @param institutionHash Hash of the institution identifier
     * @param a ZK proof component A
     * @param b ZK proof component B
     * @param c ZK proof component C
     * @param input ZK proof public inputs
     */
    function registerUID(
        bytes32 uidHash,
        bytes32 institutionHash,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external {
        require(!registeredUIDs[uidHash], "UID already registered");
        require(verifier.verifyProof(a, b, c, input), "Invalid ZK proof");
        require(msg.sender != address(0), "Invalid sender address");
        
        uidData[uidHash] = UIDData({
            uidHash: uidHash,
            institutionHash: institutionHash,
            registrationTimestamp: block.timestamp,
            isActive: true,
            arweaveMetadataUri: "",
            recoveryMethod: "",
            recoveryHash: bytes32(0)
        });
        
        registeredUIDs[uidHash] = true;
        addressToUID[msg.sender] = uidHash;
        
        emit UIDRegistered(uidHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Request UID recovery with specified method
     * @param nationalIDHash Hash of the national ID
     * @param salt Salt used for UID generation
     * @param recoveryMethod Method for recovery ("email", "phone", "biometric")
     */
    function requestRecovery(
        bytes32 nationalIDHash,
        bytes32 salt,
        string memory recoveryMethod
    ) external {
        bytes32 recoveryId = keccak256(abi.encodePacked(nationalIDHash, salt));
        
        require(!pendingRecoveries[recoveryId], "Recovery already pending");
        require(
            keccak256(abi.encodePacked(recoveryMethod)) == keccak256(abi.encodePacked("email")) ||
            keccak256(abi.encodePacked(recoveryMethod)) == keccak256(abi.encodePacked("phone")) ||
            keccak256(abi.encodePacked(recoveryMethod)) == keccak256(abi.encodePacked("biometric")),
            "Invalid recovery method"
        );
        
        recoveryData[recoveryId] = RecoveryData({
            nationalIDHash: nationalIDHash,
            salt: salt,
            requestTimestamp: block.timestamp,
            verified: false,
            recoveryMethod: recoveryMethod,
            requester: msg.sender
        });
        
        pendingRecoveries[recoveryId] = true;
        
        emit RecoveryRequested(recoveryId, recoveryMethod, block.timestamp);
    }
    
    /**
     * @dev Complete UID recovery with institution signature verification
     * @param nationalIDHash Hash of the national ID
     * @param salt Salt used for UID generation
     * @param newAddress New address to associate with the UID
     * @param signature Signature from authorized institution
     */
    function completeRecovery(
        bytes32 nationalIDHash,
        bytes32 salt,
        address newAddress,
        bytes memory signature
    ) external onlyOwner {
        bytes32 recoveryId = keccak256(abi.encodePacked(nationalIDHash, salt));
        require(pendingRecoveries[recoveryId], "No pending recovery");
        require(newAddress != address(0), "Invalid new address");
        
        // Verify signature from authorized institution
        bytes32 messageHash = keccak256(abi.encodePacked(recoveryId, newAddress));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(isAuthorizedInstitution(signer), "Unauthorized institution");
        
        // Recreate UID using same logic
        bytes32 uidHash = recreateUID(nationalIDHash, salt);
        require(registeredUIDs[uidHash], "UID not found");
        
        // Update address mapping
        addressToUID[newAddress] = uidHash;
        pendingRecoveries[recoveryId] = false;
        recoveryData[recoveryId].verified = true;
        
        emit RecoveryCompleted(uidHash, newAddress, block.timestamp);
    }
    
    /**
     * @dev Set recovery method for a UID
     * @param uidHash Hash of the UID
     * @param recoveryMethod Recovery method to set
     * @param recoveryHash Hash of recovery data
     */
    function setRecoveryMethod(
        bytes32 uidHash,
        string memory recoveryMethod,
        bytes32 recoveryHash
    ) external {
        require(registeredUIDs[uidHash], "UID not found");
        require(addressToUID[msg.sender] == uidHash, "Not UID owner");
        
        uidData[uidHash].recoveryMethod = recoveryMethod;
        uidData[uidHash].recoveryHash = recoveryHash;
    }
    
    /**
     * @dev Update Arweave metadata URI for a UID
     * @param uidHash Hash of the UID
     * @param metadataUri New metadata URI
     */
    function updateMetadataUri(
        bytes32 uidHash,
        string memory metadataUri
    ) external {
        require(registeredUIDs[uidHash], "UID not found");
        require(addressToUID[msg.sender] == uidHash, "Not UID owner");
        
        uidData[uidHash].arweaveMetadataUri = metadataUri;
    }
    
    /**
     * @dev Authorize or deauthorize an institution
     * @param institution Address of the institution
     * @param authorized Whether to authorize or deauthorize
     */
    function setInstitutionAuthorization(
        address institution,
        bool authorized
    ) external onlyOwner {
        authorizedInstitutions[institution] = authorized;
        emit InstitutionAuthorized(institution, authorized);
    }
    
    /**
     * @dev Get UID data for an address
     * @param userAddress Address of the user
     * @return UID data struct
     */
    function getUIDData(address userAddress) external view returns (UIDData memory) {
        bytes32 uidHash = addressToUID[userAddress];
        require(uidHash != bytes32(0), "No UID found for address");
        return uidData[uidHash];
    }
    
    /**
     * @dev Check if an address has a registered UID
     * @param userAddress Address to check
     * @return True if UID exists
     */
    function hasUID(address userAddress) external view returns (bool) {
        return addressToUID[userAddress] != bytes32(0);
    }
    
    /**
     * @dev Get recovery data for a recovery ID
     * @param recoveryId Recovery ID to check
     * @return Recovery data struct
     */
    function getRecoveryData(bytes32 recoveryId) external view returns (RecoveryData memory) {
        return recoveryData[recoveryId];
    }
    
    /**
     * @dev Check if an institution is authorized
     * @param institution Address of the institution
     * @return True if authorized
     */
    function isAuthorizedInstitution(address institution) public view returns (bool) {
        return authorizedInstitutions[institution];
    }
    
    /**
     * @dev Get UID hash by address
     * @param userAddress Address of the user
     * @return UID hash
     */
    function getUIDByAddress(address userAddress) external view returns (bytes32) {
        return addressToUID[userAddress];
    }
    
    /**
     * @dev Check if a UID is registered
     * @param uidHash UID hash to check
     * @return True if registered
     */
    function isUIDRegistered(bytes32 uidHash) external view returns (bool) {
        return registeredUIDs[uidHash];
    }
    
    /**
     * @dev Recreate UID using national ID and salt
     * @param nationalIDHash Hash of the national ID
     * @param salt Salt used for UID generation
     * @return Recreated UID hash
     */
    function recreateUID(bytes32 nationalIDHash, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(nationalIDHash, salt));
    }
    
    /**
     * @dev Authorize contract upgrades (only owner)
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

/**
 * @title IVerifier
 * @dev Interface for ZK proof verification
 */
interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external view returns (bool);
}
