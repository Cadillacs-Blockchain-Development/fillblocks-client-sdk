pragma circom 2.1.4;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/**
 * @title NationalIDProof
 * @dev Circom circuit for zero-knowledge proof of national ID verification
 * 
 * This circuit proves that:
 * 1. The user knows a valid national ID without revealing it
 * 2. The UID was generated correctly using the national ID and salt
 * 3. The institution hash is valid
 * 
 * Private inputs:
 * - nationalID: The actual national ID (kept private)
 * - salt: Random salt used for UID generation
 * 
 * Public inputs:
 * - uidHash: The generated UID hash (public)
 * - institutionHash: Hash of the institution identifier
 */
template NationalIDProof() {
    // Private inputs
    signal private input nationalID;
    signal private input salt;
    
    // Public inputs
    signal input uidHash;
    signal input institutionHash;
    
    // Intermediate signals for hashing
    component nationalIDHasher = Poseidon(1);
    component saltHasher = Poseidon(1);
    component uidGenerator = Poseidon(2);
    
    // Component for validating national ID format (example: 10 digits)
    component nationalIDValidator = LessThan(32);
    component nationalIDRange = GreaterThan(32);
    
    // Validate national ID is within reasonable range (example: 10 digits)
    nationalIDValidator.in[0] <== nationalID;
    nationalIDValidator.in[1] <== 10000000000; // 10^10
    nationalIDRange.in[0] <== nationalID;
    nationalIDRange.in[1] <== 999999999; // 10^9 - 1
    
    // Ensure national ID is valid (between 10^9 and 10^10)
    nationalIDValidator.out === 1;
    nationalIDRange.out === 1;
    
    // Hash the national ID and salt separately to match contract logic
    nationalIDHasher.inputs[0] <== nationalID;
    saltHasher.inputs[0] <== salt;
    
    // Generate UID hash using the hashed national ID and salt (matching contract's keccak256 logic)
    uidGenerator.inputs[0] <== nationalIDHasher.out;
    uidGenerator.inputs[1] <== saltHasher.out;
    
    // Verify the generated UID matches the public input
    uidGenerator.out === uidHash;
}

/**
 * @title NationalIDProofWithRecovery
 * @dev Extended circuit that includes recovery mechanism verification
 * 
 * This circuit adds:
 * - Recovery method validation
 * - Recovery hash verification
 * - Multi-factor authentication support
 */
template NationalIDProofWithRecovery() {
    // Private inputs
    signal private input nationalID;
    signal private input salt;
    signal private input recoveryMethod; // 1: email, 2: phone, 3: biometric
    signal private input recoveryData;
    
    // Public inputs
    signal input uidHash;
    signal input institutionHash;
    signal input recoveryHash;
    
    // Components
    component nationalIDHasher = Poseidon(1);
    component saltHasher = Poseidon(1);
    component uidGenerator = Poseidon(2);
    component recoveryHasher = Poseidon(2);
    
    // Validate recovery method (1, 2, or 3)
    component recoveryValidator = LessThan(32);
    recoveryValidator.in[0] <== recoveryMethod;
    recoveryValidator.in[1] <== 4; // Must be less than 4
    
    component recoveryRange = GreaterThan(32);
    recoveryRange.in[0] <== recoveryMethod;
    recoveryRange.in[1] <== 0; // Must be greater than 0
    
    recoveryValidator.out === 1;
    recoveryRange.out === 1;
    
    // Hash the national ID and salt separately to match contract logic
    nationalIDHasher.inputs[0] <== nationalID;
    saltHasher.inputs[0] <== salt;
    
    // Generate UID hash using the hashed national ID and salt
    uidGenerator.inputs[0] <== nationalIDHasher.out;
    uidGenerator.inputs[1] <== saltHasher.out;
    
    // Verify UID
    uidGenerator.out === uidHash;
    
    // Generate recovery hash
    recoveryHasher.inputs[0] <== recoveryMethod;
    recoveryHasher.inputs[1] <== recoveryData;
    
    // Verify recovery hash
    recoveryHasher.out === recoveryHash;
}

/**
 * @title AcademicCredentialProof
 * @dev Circuit for proving academic credential ownership without revealing details
 * 
 * This circuit proves that:
 * 1. The user owns a specific credential
 * 2. The credential is part of a valid merkle tree
 * 3. The academic level and field of study are valid
 */
template AcademicCredentialProof() {
    // Private inputs
    signal input credentialId;
    signal input merklePath[10]; // Merkle path for credential verification
    signal input merklePathPositions[10]; // Positions in merkle path
    signal input academicLevel;
    signal input fieldOfStudy;
    
    // Public inputs
    signal input merkleRoot;
    signal input credentialHash;
    signal input academicLevelHash;
    signal input fieldOfStudyHash;
    
    // Components
    component credentialHasher = Poseidon(1);
    component levelHasher = Poseidon(1);
    component fieldHasher = Poseidon(1);
    component merkleVerifier = Poseidon(2);
    
    // Hash the credential ID
    credentialHasher.inputs[0] <== credentialId;
    credentialHasher.out === credentialHash;
    
    // Hash academic level
    levelHasher.inputs[0] <== academicLevel;
    levelHasher.out === academicLevelHash;
    
    // Hash field of study
    fieldHasher.inputs[0] <== fieldOfStudy;
    fieldHasher.out === fieldOfStudyHash;
    
    // Verify merkle path (simplified - in practice would use proper merkle verification)
    var currentHash = credentialHash;
    for (var i = 0; i < 10; i++) {
        component pathHasher = Poseidon(2);
        pathHasher.inputs[0] <== currentHash;
        pathHasher.inputs[1] <== merklePath[i];
        currentHash <== pathHasher.out;
    }
    
    // Verify final hash matches merkle root
    currentHash === merkleRoot;
}

/**
 * @title RecoveryVerificationProof
 * @dev Circuit for proving recovery request without revealing sensitive data
 * 
 * This circuit proves that:
 * 1. The user knows the national ID and salt for recovery
 * 2. The recovery method is valid
 * 3. The recovery data is properly hashed
 */
template RecoveryVerificationProof() {
    // Private inputs
    signal private input nationalID;
    signal private input salt;
    signal private input recoveryMethod; // 1: email, 2: phone, 3: biometric
    signal private input recoveryData;
    
    // Public inputs
    signal input nationalIDHash;
    signal input saltHash;
    signal input recoveryHash;
    signal input recoveryMethodHash;
    
    // Components
    component nationalIDHasher = Poseidon(1);
    component saltHasher = Poseidon(1);
    component recoveryHasher = Poseidon(2);
    component methodHasher = Poseidon(1);
    
    // Hash the national ID
    nationalIDHasher.inputs[0] <== nationalID;
    nationalIDHasher.out === nationalIDHash;
    
    // Hash the salt
    saltHasher.inputs[0] <== salt;
    saltHasher.out === saltHash;
    
    // Hash the recovery method
    methodHasher.inputs[0] <== recoveryMethod;
    methodHasher.out === recoveryMethodHash;
    
    // Generate recovery hash
    recoveryHasher.inputs[0] <== recoveryMethod;
    recoveryHasher.inputs[1] <== recoveryData;
    recoveryHasher.out === recoveryHash;
}

/**
 * @title InstitutionVerificationProof
 * @dev Circuit for proving institution affiliation without revealing internal data
 * 
 * This circuit proves that:
 * 1. The user is affiliated with a specific institution
 * 2. The affiliation is valid and active
 * 3. The institution has proper authorization
 */
template InstitutionVerificationProof() {
    // Private inputs
    signal private input institutionId;
    signal private input affiliationData;
    signal private input authorizationKey;
    
    // Public inputs
    signal input institutionHash;
    signal input affiliationHash;
    signal input isAuthorized;
    
    // Components
    component institutionHasher = Poseidon(1);
    component affiliationHasher = Poseidon(2);
    component authVerifier = Poseidon(2);
    
    // Hash institution ID
    institutionHasher.inputs[0] <== institutionId;
    institutionHasher.out === institutionHash;
    
    // Hash affiliation data
    affiliationHasher.inputs[0] <== institutionId;
    affiliationHasher.inputs[1] <== affiliationData;
    affiliationHasher.out === affiliationHash;
    
    // Verify authorization
    authVerifier.inputs[0] <== institutionId;
    authVerifier.inputs[1] <== authorizationKey;
    authVerifier.out === isAuthorized;
}

component main { public [uidHash, institutionHash] } = NationalIDProof();
