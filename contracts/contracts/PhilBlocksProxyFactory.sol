// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./PhilBlocksUID.sol";

contract PhilBlocksProxyFactory {
    // Current implementation address
    address public implementation;
    
    // Mapping of proxy IDs to deployed proxy addresses
    mapping(bytes32 => address) public deployedProxies;
    
    // Mapping of proxy addresses to their IDs
    mapping(address => bytes32) public proxyToId;
    
    // Events
    event ProxyDeployed(bytes32 indexed proxyId, address indexed proxyAddress, address indexed implementation);
    event ProxyUpgraded(bytes32 indexed proxyId, address indexed proxyAddress, address indexed newImplementation);
    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);
    
    /**
     * @dev Constructor to set initial implementation
     * @param _implementation Address of the initial implementation contract
     */
    constructor(address _implementation) {
        require(_implementation != address(0), "Invalid implementation address");
        implementation = _implementation;
    }
    
    /**
     * @dev Deploy a new proxy contract
     * @param proxyId Unique identifier for the proxy
     * @param initData Initialization data for the proxy
     * @return proxy Address of the deployed proxy contract
     */
    function deployProxy(
        bytes32 proxyId,
        bytes memory initData
    ) external returns (address proxy) {
        require(deployedProxies[proxyId] == address(0), "Proxy already exists");
        require(proxyId != bytes32(0), "Invalid proxy ID");
        
        // Deploy proxy with current implementation
        proxy = address(new ERC1967Proxy(implementation, initData));
        
        // Store proxy information
        deployedProxies[proxyId] = proxy;
        proxyToId[proxy] = proxyId;
        
        emit ProxyDeployed(proxyId, proxy, implementation);
    }
    
    /**
     * @dev Upgrade an existing proxy contract
     * @param proxyId ID of the proxy to upgrade
     * @param newImplementation Address of the new implementation
     */
    function upgradeProxy(
        bytes32 proxyId,
        address newImplementation
    ) external {
        require(newImplementation != address(0), "Invalid implementation address");
        
        address proxy = deployedProxies[proxyId];
        require(proxy != address(0), "Proxy not found");
        
        // Upgrade the proxy
        PhilBlocksUID(proxy).upgradeTo(newImplementation);
        
        emit ProxyUpgraded(proxyId, proxy, newImplementation);
    }
    
    /**
     * @dev Update the default implementation for new deployments
     * @param newImplementation Address of the new implementation
     */
    function updateImplementation(address newImplementation) external {
        require(newImplementation != address(0), "Invalid implementation address");
        
        address oldImplementation = implementation;
        implementation = newImplementation;
        
        emit ImplementationUpdated(oldImplementation, newImplementation);
    }
    
    /**
     * @dev Get proxy address by ID
     * @param proxyId ID of the proxy
     * @return Address of the proxy contract
     */
    function getProxyAddress(bytes32 proxyId) external view returns (address) {
        return deployedProxies[proxyId];
    }
    
    /**
     * @dev Get proxy ID by address
     * @param proxyAddress Address of the proxy
     * @return ID of the proxy
     */
    function getProxyId(address proxyAddress) external view returns (bytes32) {
        return proxyToId[proxyAddress];
    }
    
    /**
     * @dev Check if a proxy exists
     * @param proxyId ID of the proxy to check
     * @return True if proxy exists
     */
    function proxyExists(bytes32 proxyId) external view returns (bool) {
        return deployedProxies[proxyId] != address(0);
    }
    
    /**
     * @dev Get all proxy information
     * @param proxyId ID of the proxy
     * @return proxyAddress Address of the proxy
     * @return proxyId_ ID of the proxy (same as input)
     */
    function getProxyInfo(bytes32 proxyId) external view returns (address proxyAddress, bytes32 proxyId_) {
        proxyAddress = deployedProxies[proxyId];
        proxyId_ = proxyId;
    }
}
