// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockVerifier {
    function verifyProof(
        uint[2] memory /*a*/,
        uint[2][2] memory /*b*/,
        uint[2] memory /*c*/,
        uint[2] memory /*input*/
    ) external pure returns (bool) {
        return true;
    }
}


