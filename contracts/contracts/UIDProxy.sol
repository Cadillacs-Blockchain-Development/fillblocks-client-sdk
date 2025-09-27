// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UIDProxy is Ownable {
    // UID to wallet mappings
    mapping(bytes32 => address) public uidToWallet;
    mapping(address => bytes32) public walletToUID;
    
    // Authorization mappings for UID management
    mapping(bytes32 => address[]) public uidAuthorizedAddresses;
    mapping(bytes32 => mapping(address => bool)) public isAuthorizedForUID;
    
    // Events
    event WalletUpdated(bytes32 indexed uidHash, address indexed oldWallet, address indexed newWallet);
    event AuthorizationGranted(bytes32 indexed uidHash, address indexed authorizedAddress);
    event AuthorizationRevoked(bytes32 indexed uidHash, address indexed authorizedAddress);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Set wallet for a UID (only UID owner or authorized addresses)
     * @param uidHash UID hash
     * @param walletAddress Wallet address to associate with UID
     */
    function setWallet(bytes32 uidHash, address walletAddress) external {
        require(
            msg.sender == getCurrentWallet(uidHash) || 
            isAuthorizedForUID[uidHash][msg.sender] || 
            msg.sender == owner(),
            "Not authorized to update wallet"
        );
        require(walletAddress != address(0), "Invalid wallet address");
        
        address oldWallet = uidToWallet[uidHash];
        
        // Remove old wallet mapping if exists
        if (oldWallet != address(0)) {
            walletToUID[oldWallet] = bytes32(0);
        }
        
        // Set new wallet mapping
        uidToWallet[uidHash] = walletAddress;
        walletToUID[walletAddress] = uidHash;
        
        emit WalletUpdated(uidHash, oldWallet, walletAddress);
    }
    
    /**
     * @dev Get current wallet for a UID
     * @param uidHash UID hash
     * @return wallet Current wallet address (address(0) if no wallet set)
     */
    function getCurrentWallet(bytes32 uidHash) public view returns (address wallet) {
        return uidToWallet[uidHash];
    }
    
    /**
     * @dev Get UID for a wallet address
     * @param walletAddress Wallet address
     * @return uidHash UID hash (bytes32(0) if no UID associated)
     */
    function getUIDByWallet(address walletAddress) external view returns (bytes32 uidHash) {
        return walletToUID[walletAddress];
    }
    
    /**
     * @dev Grant authorization to an address for a UID
     * @param uidHash UID hash
     * @param authorizedAddress Address to authorize
     */
    function grantAuthorization(bytes32 uidHash, address authorizedAddress) external {
        require(
            msg.sender == getCurrentWallet(uidHash) || 
            isAuthorizedForUID[uidHash][msg.sender] || 
            msg.sender == owner(),
            "Not authorized to grant authorization"
        );
        require(authorizedAddress != address(0), "Invalid address");
        require(!isAuthorizedForUID[uidHash][authorizedAddress], "Already authorized");
        
        isAuthorizedForUID[uidHash][authorizedAddress] = true;
        uidAuthorizedAddresses[uidHash].push(authorizedAddress);
        
        emit AuthorizationGranted(uidHash, authorizedAddress);
    }
    
    /**
     * @dev Revoke authorization from an address for a UID
     * @param uidHash UID hash
     * @param authorizedAddress Address to revoke authorization from
     */
    function revokeAuthorization(bytes32 uidHash, address authorizedAddress) external {
        require(
            msg.sender == getCurrentWallet(uidHash) || 
            isAuthorizedForUID[uidHash][msg.sender] || 
            msg.sender == owner(),
            "Not authorized to revoke authorization"
        );
        require(isAuthorizedForUID[uidHash][authorizedAddress], "Not authorized");
        
        isAuthorizedForUID[uidHash][authorizedAddress] = false;
        
        // Remove from authorized addresses array
        address[] storage authorizedList = uidAuthorizedAddresses[uidHash];
        for (uint256 i = 0; i < authorizedList.length; i++) {
            if (authorizedList[i] == authorizedAddress) {
                authorizedList[i] = authorizedList[authorizedList.length - 1];
                authorizedList.pop();
                break;
            }
        }
        
        emit AuthorizationRevoked(uidHash, authorizedAddress);
    }
    
    /**
     * @dev Get all authorized addresses for a UID
     * @param uidHash UID hash
     * @return authorizedAddresses Array of authorized addresses
     */
    function getAuthorizedAddresses(bytes32 uidHash) external view returns (address[] memory authorizedAddresses) {
        return uidAuthorizedAddresses[uidHash];
    }
    
    /**
     * @dev Check if an address is authorized for a UID
     * @param uidHash UID hash
     * @param addressToCheck Address to check
     * @return True if authorized
     */
    function isAddressAuthorized(bytes32 uidHash, address addressToCheck) external view returns (bool) {
        return isAuthorizedForUID[uidHash][addressToCheck];
    }
    
    /**
     * @dev Remove wallet association for a UID (emergency function)
     * @param uidHash UID hash
     */
    function removeWallet(bytes32 uidHash) external {
        require(
            msg.sender == getCurrentWallet(uidHash) || 
            msg.sender == owner(),
            "Not authorized to remove wallet"
        );
        
        address oldWallet = uidToWallet[uidHash];
        if (oldWallet != address(0)) {
            uidToWallet[uidHash] = address(0);
            walletToUID[oldWallet] = bytes32(0);
            
            emit WalletUpdated(uidHash, oldWallet, address(0));
        }
    }
    
    /**
     * @dev Batch update wallets for multiple UIDs (only owner)
     * @param uidHashes Array of UID hashes
     * @param walletAddresses Array of corresponding wallet addresses
     */
    function batchSetWallets(bytes32[] memory uidHashes, address[] memory walletAddresses) external onlyOwner {
        require(uidHashes.length == walletAddresses.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < uidHashes.length; i++) {
            require(walletAddresses[i] != address(0), "Invalid wallet address");
            
            address oldWallet = uidToWallet[uidHashes[i]];
            
            // Remove old wallet mapping if exists
            if (oldWallet != address(0)) {
                walletToUID[oldWallet] = bytes32(0);
            }
            
            // Set new wallet mapping
            uidToWallet[uidHashes[i]] = walletAddresses[i];
            walletToUID[walletAddresses[i]] = uidHashes[i];
            
            emit WalletUpdated(uidHashes[i], oldWallet, walletAddresses[i]);
        }
    }
}
