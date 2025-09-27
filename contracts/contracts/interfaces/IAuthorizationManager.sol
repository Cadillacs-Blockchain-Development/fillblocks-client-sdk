// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthorizationManager {
    // Role definitions
    function ADMIN_ROLE() external view returns (bytes32);
    function INSTITUTION_ROLE() external view returns (bytes32);
    function STUDENT_ROLE() external view returns (bytes32);
    function UPDATER_ROLE() external view returns (bytes32);
    function MINTER_ROLE() external view returns (bytes32);
    function VERIFIER_ROLE() external view returns (bytes32);
    
    // Core authorization functions
    function hasRole(bytes32 role, address account) external view returns (bool);
    function isAuthorizedInstitution(address institution) external view returns (bool);
    function isAuthorizedMinter(address minter) external view returns (bool);
    function isAuthorizedUpdater(address updater) external view returns (bool);
    function isAuthorizedVerifier(address verifier) external view returns (bool);
    
    // Student-specific authorization
    function isStudentAuthorized(bytes32 studentUID, address caller) external view returns (bool);
    function isInstitutionAuthorizedForStudent(bytes32 studentUID, address institution) external view returns (bool);
    
    // Contract management authorization
    function isContractManager(address caller) external view returns (bool);
    function isSystemAdmin(address caller) external view returns (bool);
    
    // Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event InstitutionAuthorizationUpdated(address indexed institution, bool authorized);
    event StudentAuthorizationUpdated(bytes32 indexed studentUID, address indexed caller, bool authorized);
}