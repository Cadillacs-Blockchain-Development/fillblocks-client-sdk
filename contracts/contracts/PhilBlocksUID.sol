// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract PhilBlocksUID is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    using ECDSA for bytes32;
    
    // Role definitions (consistent with PhilBlocksCore)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    // ZK Proof verifier contract
    IVerifier public verifier;
    // Temporary mock verification flag
    bool public mockVerificationEnabled;
    
    // UID mappings
    mapping(bytes32 => bool) public registeredUIDs;
    mapping(bytes32 => UIDData) public uidData;
    mapping(address => bytes32) public addressToUID;
    
    // Recovery mappings
    mapping(bytes32 => RecoveryData) public recoveryData;
    mapping(bytes32 => bool) public pendingRecoveries;
    
    // Institution management (now using AccessControl)
    mapping(bytes32 => address) public institutionUIDs;
    
    // Centralized role management
    address public roleManager; // PhilBlocksCore address
    
    // Events
    event UIDRegistered(bytes32 indexed uidHash, address indexed user, uint256 timestamp);
    event RecoveryRequested(bytes32 indexed recoveryId, string recoveryMethod, uint256 timestamp);
    event RecoveryCompleted(bytes32 indexed uidHash, address indexed newAddress, uint256 timestamp);
    event InstitutionRoleGranted(address indexed institution);
    event InstitutionRoleRevoked(address indexed institution);
    
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
     * @param _admin Address of the admin (will be granted DEFAULT_ADMIN_ROLE)
     */
    function initialize(address _verifier, address _admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        require(_verifier != address(0), "Invalid verifier address");
        require(_admin != address(0), "Invalid admin address");
        
        verifier = IVerifier(_verifier);
        mockVerificationEnabled = false;
        
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
        require(_verifyProofOrMock(uidHash, institutionHash, a, b, c, input), "Invalid ZK proof");
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
    ) external onlyRole(ADMIN_ROLE) {
        bytes32 recoveryId = keccak256(abi.encodePacked(nationalIDHash, salt));
        require(pendingRecoveries[recoveryId], "No pending recovery");
        require(newAddress != address(0), "Invalid new address");
        
        // Verify signature from authorized institution
        bytes32 messageHash = keccak256(abi.encodePacked(recoveryId, newAddress));
        address signer = ECDSA.recover(messageHash, signature);
        
        require(hasRole(ADMIN_ROLE, signer) || hasRole(INSTITUTION_ROLE, signer), "Unauthorized institution");
        
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
        return hasRole(ADMIN_ROLE, institution) || hasRole(INSTITUTION_ROLE, institution);
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
     * 
     * Note: This function should match the circuit's Poseidon hashing logic
     * In practice, you would use a Poseidon hash library or precomputed values
     */
    function recreateUID(bytes32 nationalIDHash, bytes32 salt) internal pure returns (bytes32) {
        // For now, using keccak256 as a placeholder
        // In production, this should use Poseidon hashing to match the circuit
        return keccak256(abi.encodePacked(nationalIDHash, salt));
    }
    
    /**
     * @dev Poseidon hash function (placeholder - should be implemented with proper library)
     * @param inputs Array of field elements to hash
     * @return Poseidon hash result
     */
    function poseidonHash(uint256[] memory inputs) internal pure returns (uint256) {
        // This is a placeholder implementation
        // In production, use a proper Poseidon hash library like poseidon-solidity
        require(inputs.length > 0, "Empty inputs");
        
        // Simple hash combination for now
        uint256 result = inputs[0];
        for (uint256 i = 1; i < inputs.length; i++) {
            result = uint256(keccak256(abi.encodePacked(result, inputs[i])));
        }
        return result;
    }

    /**
     * @dev Enable/disable mock verification (admin only)
     * @param enabled Whether mock verification is enabled
     */
    function setMockVerificationEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        mockVerificationEnabled = enabled;
    }

    /**
     * @dev Internal helper to either verify proof via verifier or mock check
     * When mock is enabled, it verifies that input[0] == uidHash and input[1] == institutionHash
     */
    function _verifyProofOrMock(
        bytes32 uidHash,
        bytes32 institutionHash,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) internal view returns (bool) {
        if (mockVerificationEnabled) {
            // In mock mode, simply ensure public inputs echo the supplied parameters
            return (bytes32(input[0]) == uidHash && bytes32(input[1]) == institutionHash);
        }
        return verifier.verifyProof(a, b, c, input);
    }
    
    /**
     * @dev Authorize contract upgrades (only admin)
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
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
