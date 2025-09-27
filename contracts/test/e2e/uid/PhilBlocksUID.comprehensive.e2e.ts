import { expect } from "chai";
import { ethers } from "hardhat";
import { MockData } from "../../helpers/MockData";
import { TestSetup } from "../../helpers/TestSetup";

describe("PhilBlocksUID Comprehensive E2E Tests", function () {
  let contracts: any;
  let mockUsers: any;
  let mockInstitutions: any;
  let mockAdmins: any;

  beforeEach(async function () {
    contracts = await TestSetup.deployAllContracts();
    mockUsers = MockData.MOCK_USERS;
    mockInstitutions = MockData.MOCK_INSTITUTIONS;
    mockAdmins = MockData.MOCK_ADMINS;
  });

  describe("UID Registration", function () {
    it("should register UID with mock mode enabled", async function () {
      const { student1, uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);

      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      await expect(
        uid.connect(student1).registerUID(
          uidHash,
          institutionHash,
          proof.a as any,
          proof.b as any,
          proof.c as any,
          proof.input as any
        )
      ).to.emit(uid, "UIDRegistered");

      expect(await uid.hasUID(await student1.getAddress())).to.be.true;
      expect(await uid.getUIDByAddress(await student1.getAddress())).to.equal(uidHash);
      expect(await uid.isUIDRegistered(uidHash)).to.be.true;
    });

    it("should fail registration when mock mode enabled but inputs don't match", async function () {
      const { student1, uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);

      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const wrongInstitutionHash = MockData.generateInstitutionHash("wrong-institution");
      const proof = MockData.generateMockProof(uidHash, wrongInstitutionHash);

      await expect(
        uid.connect(student1).registerUID(
          uidHash,
          institutionHash,
          proof.a as any,
          proof.b as any,
          proof.c as any,
          proof.input as any
        )
      ).to.be.revertedWith("Invalid ZK proof");
    });

    it("should register UID with real verifier when mock disabled", async function () {
      const { student1, uid } = contracts;
      await uid.connect(contracts.admin).setMockVerificationEnabled(false);

      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      await expect(
        uid.connect(student1).registerUID(
          uidHash,
          institutionHash,
          proof.a as any,
          proof.b as any,
          proof.c as any,
          proof.input as any
        )
      ).to.emit(uid, "UIDRegistered");
    });

    it("should prevent duplicate UID registration", async function () {
      const { student1, uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);

      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      // First registration
      await uid.connect(student1).registerUID(
        uidHash,
        institutionHash,
        proof.a as any,
        proof.b as any,
        proof.c as any,
        proof.input as any
      );

      // Second registration should fail
      await expect(
        uid.connect(student1).registerUID(
          uidHash,
          institutionHash,
          proof.a as any,
          proof.b as any,
          proof.c as any,
          proof.input as any
        )
      ).to.be.revertedWith("UID already registered");
    });

    it("should prevent registration with zero address", async function () {
      const { uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);

      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      // This should fail because we're using a zero address signer
      // We need to create a contract instance with a zero address signer
      const zeroSigner = await ethers.getImpersonatedSigner(ethers.ZeroAddress);
      // Fund the zero address signer
      await contracts.deployer.sendTransaction({
        to: ethers.ZeroAddress,
        value: ethers.parseEther("1.0")
      });
      await expect(
        uid.connect(zeroSigner).registerUID(
          uidHash,
          institutionHash,
          proof.a as any,
          proof.b as any,
          proof.c as any,
          proof.input as any
        )
      ).to.be.revertedWith("Invalid sender address");
    });
  });

  describe("Recovery System", function () {
    beforeEach(async function () {
      const { student1, uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);
      await TestSetup.setupInstitutions(uid, contracts.core, contracts.institution1, contracts.institution2, contracts.admin);

      // Register a student first
      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      await uid.connect(student1).registerUID(
        uidHash,
        institutionHash,
        proof.a as any,
        proof.b as any,
        proof.c as any,
        proof.input as any
      );
    });

    it("should request recovery with email method", async function () {
      const { student1, uid } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;

      await expect(
        uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod)
      ).to.emit(uid, "RecoveryRequested");

      const recoveryId = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [nationalIDHash, salt]));
      const recoveryData = await uid.getRecoveryData(recoveryId);
      expect(recoveryData.recoveryMethod).to.equal(recoveryMethod);
      expect(recoveryData.verified).to.be.false;
    });

    it("should request recovery with phone method", async function () {
      const { student1, uid } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.phone.method;

      await expect(
        uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod)
      ).to.emit(uid, "RecoveryRequested");
    });

    it("should request recovery with biometric method", async function () {
      const { student1, uid } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.biometric.method;

      await expect(
        uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod)
      ).to.emit(uid, "RecoveryRequested");
    });

    it("should fail recovery request with invalid method", async function () {
      const { student1, uid } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const invalidMethod = "invalid_method";

      await expect(
        uid.connect(student1).requestRecovery(nationalIDHash, salt, invalidMethod)
      ).to.be.revertedWith("Invalid recovery method");
    });

    it("should prevent duplicate recovery requests", async function () {
      const { student1, uid } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;

      // First request
      await uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod);

      // Second request should fail
      await expect(
        uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod)
      ).to.be.revertedWith("Recovery already pending");
    });

    it("should complete recovery with authorized institution signature", async function () {
      const { student1, student2, uid, admin } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;

      // Request recovery
      await uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod);

      // Create signature from authorized institution
      const recoveryId = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [nationalIDHash, salt]));
      const newAddress = await student2.getAddress();
      const messageHash = ethers.keccak256(ethers.solidityPacked(["bytes32", "address"], [recoveryId, newAddress]));
      const signature = await contracts.institution1.signMessage(ethers.getBytes(messageHash));

      // Complete recovery
      await expect(
        uid.connect(admin).completeRecovery(nationalIDHash, salt, newAddress, signature)
      ).to.emit(uid, "RecoveryCompleted");

      // Verify new address has the UID
      expect(await uid.hasUID(newAddress)).to.be.true;
    });

    it("should fail recovery completion with unauthorized institution", async function () {
      const { student1, student2, uid, admin } = contracts;
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.salt));
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;

      // Request recovery
      await uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod);

      // Create signature from unauthorized institution
      const recoveryId = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [nationalIDHash, salt]));
      const newAddress = await student2.getAddress();
      const messageHash = ethers.keccak256(ethers.solidityPacked(["bytes32", "address"], [recoveryId, newAddress]));
      const signature = await contracts.student2.signMessage(ethers.getBytes(messageHash));

      // Complete recovery should fail
      await expect(
        uid.connect(admin).completeRecovery(nationalIDHash, salt, newAddress, signature)
      ).to.be.revertedWith("Unauthorized institution");
    });
  });

  describe("Recovery Method Management", function () {
    beforeEach(async function () {
      const { student1, uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);

      // Register a student
      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      await uid.connect(student1).registerUID(
        uidHash,
        institutionHash,
        proof.a as any,
        proof.b as any,
        proof.c as any,
        proof.input as any
      );
    });

    it("should set recovery method for UID owner", async function () {
      const { student1, uid } = contracts;
      const uidHash = await uid.getUIDByAddress(await student1.getAddress());
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;
      const recoveryHash = MockData.MOCK_RECOVERY_DATA.email.hash;

      await uid.connect(student1).setRecoveryMethod(uidHash, recoveryMethod, recoveryHash);

      const uidData = await uid.getUIDData(await student1.getAddress());
      expect(uidData.recoveryMethod).to.equal(recoveryMethod);
      expect(uidData.recoveryHash).to.equal(recoveryHash);
    });

    it("should fail to set recovery method for non-owner", async function () {
      const { student1, student2, uid } = contracts;
      const uidHash = await uid.getUIDByAddress(await student1.getAddress());
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;
      const recoveryHash = MockData.MOCK_RECOVERY_DATA.email.hash;

      await expect(
        uid.connect(student2).setRecoveryMethod(uidHash, recoveryMethod, recoveryHash)
      ).to.be.revertedWith("Not UID owner");
    });

    it("should update metadata URI for UID owner", async function () {
      const { student1, uid } = contracts;
      const uidHash = await uid.getUIDByAddress(await student1.getAddress());
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;

      await uid.connect(student1).updateMetadataUri(uidHash, metadataUri);

      const uidData = await uid.getUIDData(await student1.getAddress());
      expect(uidData.arweaveMetadataUri).to.equal(metadataUri);
    });

    it("should fail to update metadata URI for non-owner", async function () {
      const { student1, student2, uid } = contracts;
      const uidHash = await uid.getUIDByAddress(await student1.getAddress());
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;

      await expect(
        uid.connect(student2).updateMetadataUri(uidHash, metadataUri)
      ).to.be.revertedWith("Not UID owner");
    });
  });

  describe("Institution Management", function () {
    it("should authorize institution by owner", async function () {
      const { admin, uid } = contracts;
      const institutionAddress = await contracts.institution1.getAddress();

      await expect(
        uid.connect(admin).grantInstitutionRole(institutionAddress)
      ).to.emit(uid, "InstitutionRoleGranted");

      expect(await uid.isAuthorizedInstitution(institutionAddress)).to.be.true;
    });

    it("should deauthorize institution by owner", async function () {
      const { admin, uid } = contracts;
      const institutionAddress = await contracts.institution1.getAddress();

      // First authorize
      await uid.connect(admin).grantInstitutionRole(institutionAddress);
      expect(await uid.isAuthorizedInstitution(institutionAddress)).to.be.true;

      // Then deauthorize
      await uid.connect(admin).revokeInstitutionRole(institutionAddress);
      expect(await uid.isAuthorizedInstitution(institutionAddress)).to.be.false;
    });

    it("should fail to authorize institution by non-owner", async function () {
      const { student1, uid } = contracts;
      const institutionAddress = await contracts.institution1.getAddress();

      await expect(
        uid.connect(student1).grantInstitutionRole(institutionAddress)
      ).to.be.revertedWithCustomError(uid, "AccessControlUnauthorizedAccount");
    });
  });

  describe("UID Data Queries", function () {
    beforeEach(async function () {
      const { student1, uid } = contracts;
      await TestSetup.setupMockVerification(uid, contracts.admin);

      // Register a student
      const uidHash = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);
      const institutionHash = MockData.generateInstitutionHash(mockUsers.student1.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      await uid.connect(student1).registerUID(
        uidHash,
        institutionHash,
        proof.a as any,
        proof.b as any,
        proof.c as any,
        proof.input as any
      );
    });

    it("should get UID data for registered address", async function () {
      const { student1, uid } = contracts;
      const uidData = await uid.getUIDData(await student1.getAddress());

      expect(uidData.uidHash).to.not.equal(ethers.ZeroHash);
      expect(uidData.institutionHash).to.not.equal(ethers.ZeroHash);
      expect(uidData.isActive).to.be.true;
      expect(uidData.registrationTimestamp).to.be.greaterThan(0);
    });

    it("should fail to get UID data for unregistered address", async function () {
      const { student2, uid } = contracts;

      await expect(
        uid.getUIDData(await student2.getAddress())
      ).to.be.revertedWith("No UID found for address");
    });

    it("should check if address has UID", async function () {
      const { student1, student2, uid } = contracts;

      expect(await uid.hasUID(await student1.getAddress())).to.be.true;
      expect(await uid.hasUID(await student2.getAddress())).to.be.false;
    });

    it("should get UID by address", async function () {
      const { student1, uid } = contracts;
      const uidHash = await uid.getUIDByAddress(await student1.getAddress());

      expect(uidHash).to.not.equal(ethers.ZeroHash);
    });

    it("should check if UID is registered", async function () {
      const { student1, uid } = contracts;
      const uidHash = await uid.getUIDByAddress(await student1.getAddress());

      expect(await uid.isUIDRegistered(uidHash)).to.be.true;
      expect(await uid.isUIDRegistered(ethers.ZeroHash)).to.be.false;
    });
  });

  describe("Mock Verification Toggle", function () {
    it("should enable mock verification by owner", async function () {
      const { admin, uid } = contracts;

      await uid.connect(admin).setMockVerificationEnabled(true);
      expect(await uid.mockVerificationEnabled()).to.be.true;
    });

    it("should disable mock verification by owner", async function () {
      const { admin, uid } = contracts;

      await uid.connect(admin).setMockVerificationEnabled(false);
      expect(await uid.mockVerificationEnabled()).to.be.false;
    });

    it("should fail to toggle mock verification by non-owner", async function () {
      const { student1, uid } = contracts;

      await expect(
        uid.connect(student1).setMockVerificationEnabled(true)
      ).to.be.revertedWithCustomError(uid, "AccessControlUnauthorizedAccount");
    });
  });
});
