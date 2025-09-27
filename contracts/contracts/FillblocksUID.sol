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
        string recoveryMethod;
        address requester;
    }
}