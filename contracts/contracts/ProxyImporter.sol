// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// This contract exists solely to ensure the ERC1967Proxy artifact is compiled and available.
contract ProxyImporter {
    function noop(address impl, bytes memory data) external pure returns (address, bytes memory) {
        return (impl, data);
    }
}


