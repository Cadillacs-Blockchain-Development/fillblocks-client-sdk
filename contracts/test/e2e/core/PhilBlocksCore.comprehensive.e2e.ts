import { expect } from "chai";
import { ethers } from "hardhat";
import { MockData } from "../../helpers/MockData";
import { TestSetup } from "../../helpers/TestSetup";

describe("PhilBlocksCore Comprehensive E2E Tests", function () {
  let contracts: any;
  let mockUsers: any;
  let mockInstitutions: any;
  let mockAdmins: any;
  let mockUpdaters: any;
  let mockStreamData: any;

  beforeEach(async function () {
    contracts = await TestSetup.deployAllContracts();
    mockUsers = MockData.MOCK_USERS;
    mockInstitutions = MockData.MOCK_INSTITUTIONS;
    mockAdmins = MockData.MOCK_ADMINS;
    mockUpdaters = MockData.MOCK_UPDATERS;
    mockStreamData = MockData.MOCK_STREAM_DATA;
  });

  describe("Role Management", function () {
    it("should grant institution role by admin", async function () {
      const { admin, core, institution1 } = contracts;

      await expect(
        core.connect(admin).grantInstitutionRole(await institution1.getAddress())
      ).to.emit(core, "InstitutionRoleGranted");

      expect(await core.hasRole(await core.INSTITUTION_ROLE(), await institution1.getAddress())).to.be.true;
    });

    it("should revoke institution role by admin", async function () {
      const { admin, core, institution1 } = contracts;

      // First grant role
      await core.connect(admin).grantInstitutionRole(await institution1.getAddress());
      expect(await core.hasRole(await core.INSTITUTION_ROLE(), await institution1.getAddress())).to.be.true;

      // Then revoke role
      await expect(
        core.connect(admin).revokeInstitutionRole(await institution1.getAddress())
      ).to.emit(core, "InstitutionRoleRevoked");

      expect(await core.hasRole(await core.INSTITUTION_ROLE(), await institution1.getAddress())).to.be.false;
    });

    it("should grant updater role by admin", async function () {
      const { admin, core, updater1 } = contracts;

      await expect(
        core.connect(admin).grantUpdaterRole(await updater1.getAddress())
      ).to.emit(core, "UpdaterRoleGranted");

      expect(await core.hasRole(await core.UPDATER_ROLE(), await updater1.getAddress())).to.be.true;
    });

    it("should revoke updater role by admin", async function () {
      const { admin, core, updater1 } = contracts;

      // First grant role
      await core.connect(admin).grantUpdaterRole(await updater1.getAddress());
      expect(await core.hasRole(await core.UPDATER_ROLE(), await updater1.getAddress())).to.be.true;

      // Then revoke role
      await expect(
        core.connect(admin).revokeUpdaterRole(await updater1.getAddress())
      ).to.emit(core, "UpdaterRoleRevoked");

      expect(await core.hasRole(await core.UPDATER_ROLE(), await updater1.getAddress())).to.be.false;
    });

    it("should fail to grant roles by non-admin", async function () {
      const { student1, core, institution1 } = contracts;

      await expect(
        core.connect(student1).grantInstitutionRole(await institution1.getAddress())
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");
    });

    it("should fail to grant role to zero address", async function () {
      const { admin, core } = contracts;

      await expect(
        core.connect(admin).grantInstitutionRole(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid institution address");
    });
  });

  describe("Student Data Stream Management", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should initialize student data stream by institution", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const initialTxId = MockData.generateArweaveTxId("init");

      await expect(
        core.connect(institution1).initializeStudentDataStream(registration.uidHash, initialTxId)
      ).to.emit(core, "StudentDataUpdated");

      const stream = await core.getStudentDataStream(registration.uidHash);
      expect(stream.uidHash).to.equal(registration.uidHash);
      expect(stream.institution).to.equal(await institution1.getAddress());
      expect(stream.isActive).to.be.true;
      expect(stream.totalUpdates).to.equal(0);
      expect(stream.currentArweaveTxId).to.equal(initialTxId);
    });

    it("should fail to initialize stream for unregistered UID", async function () {
      const { core, institution1 } = contracts;
      const unregisteredUID = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));
      const initialTxId = MockData.generateArweaveTxId("init");

      await expect(
        core.connect(institution1).initializeStudentDataStream(unregisteredUID, initialTxId)
      ).to.be.revertedWith("Student UID not registered");
    });

    it("should fail to initialize stream with empty Arweave TX ID", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];

      await expect(
        core.connect(institution1).initializeStudentDataStream(registration.uidHash, "")
      ).to.be.revertedWith("Empty Arweave transaction ID");
    });

    it("should fail to initialize stream twice", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const initialTxId = MockData.generateArweaveTxId("init");

      // First initialization
      await core.connect(institution1).initializeStudentDataStream(registration.uidHash, initialTxId);

      // Second initialization should fail
      await expect(
        core.connect(institution1).initializeStudentDataStream(registration.uidHash, initialTxId)
      ).to.be.revertedWith("Data stream already initialized");
    });

    it("should fail to initialize stream by non-institution", async function () {
      const { core, student1, registrations } = contracts;
      const registration = registrations[0];
      const initialTxId = MockData.generateArweaveTxId("init");

      await expect(
        core.connect(student1).initializeStudentDataStream(registration.uidHash, initialTxId)
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Student Data Updates", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should update student data by authorized updater", async function () {
      const { core, updater1, registrations } = contracts;
      const registration = registrations[0];
      const updateData = mockStreamData.grades;

      await expect(
        core.connect(updater1).updateStudentData(
          registration.uidHash,
          updateData.type,
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades-v1"))
        )
      ).to.emit(core, "StudentDataUpdated");

      const stream = await core.getStudentDataStream(registration.uidHash);
      expect(stream.totalUpdates).to.equal(1);

      const update = await core.getStudentDataUpdate(registration.uidHash, 1);
      expect(update.dataType).to.equal(updateData.type);
      expect(update.updateIndex).to.equal(1);
    });

    it("should update student data by institution", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const updateData = mockStreamData.attendance;

      await expect(
        core.connect(institution1).updateStudentData(
          registration.uidHash,
          updateData.type,
          MockData.generateArweaveTxId("attendance"),
          ethers.keccak256(ethers.toUtf8Bytes("prev-attendance")),
          ethers.keccak256(ethers.toUtf8Bytes("new-attendance"))
        )
      ).to.emit(core, "StudentDataUpdated");

      const stream = await core.getStudentDataStream(registration.uidHash);
      expect(stream.totalUpdates).to.equal(1);
    });

    it("should fail to update data for unregistered UID", async function () {
      const { core, updater1 } = contracts;
      const unregisteredUID = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));

      await expect(
        core.connect(updater1).updateStudentData(
          unregisteredUID,
          "GRADES",
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWith("Student UID not registered");
    });

    it("should fail to update data for uninitialized stream", async function () {
      const { core, updater1, registrations } = contracts;
      const registration = registrations[1]; // Second registration without initialized stream

      await expect(
        core.connect(updater1).updateStudentData(
          registration.uidHash,
          "GRADES",
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWith("Student data stream not initialized");
    });

    it("should fail to update data with empty data type", async function () {
      const { core, updater1, registrations } = contracts;
      const registration = registrations[0];

      await expect(
        core.connect(updater1).updateStudentData(
          registration.uidHash,
          "",
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWith("Empty data type");
    });

    it("should fail to update data with empty Arweave TX ID", async function () {
      const { core, updater1, registrations } = contracts;
      const registration = registrations[0];

      await expect(
        core.connect(updater1).updateStudentData(
          registration.uidHash,
          "GRADES",
          "",
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWith("Empty Arweave transaction ID");
    });

    it("should fail to update data by unauthorized updater", async function () {
      const { core, student1, registrations } = contracts;
      const registration = registrations[0];

      await expect(
        core.connect(student1).updateStudentData(
          registration.uidHash,
          "GRADES",
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");
    });

    it("should track multiple data updates", async function () {
      const { core, updater1, registrations } = contracts;
      const registration = registrations[0];

      // First update
      await core.connect(updater1).updateStudentData(
        registration.uidHash,
        mockStreamData.grades.type,
        MockData.generateArweaveTxId("grades"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("grades-v1"))
      );

      // Second update
      await core.connect(updater1).updateStudentData(
        registration.uidHash,
        mockStreamData.attendance.type,
        MockData.generateArweaveTxId("attendance"),
        ethers.keccak256(ethers.toUtf8Bytes("grades-v1")),
        ethers.keccak256(ethers.toUtf8Bytes("attendance-v1"))
      );

      // Third update
      await core.connect(updater1).updateStudentData(
        registration.uidHash,
        mockStreamData.assignments.type,
        MockData.generateArweaveTxId("assignments"),
        ethers.keccak256(ethers.toUtf8Bytes("attendance-v1")),
        ethers.keccak256(ethers.toUtf8Bytes("assignments-v1"))
      );

      const stream = await core.getStudentDataStream(registration.uidHash);
      expect(stream.totalUpdates).to.equal(3);

      const updateCount = await core.getStudentDataUpdateCount(registration.uidHash);
      expect(updateCount).to.equal(3);

      const latestUpdate = await core.getLatestStudentDataUpdate(registration.uidHash);
      expect(latestUpdate.dataType).to.equal(mockStreamData.assignments.type);
      expect(latestUpdate.updateIndex).to.equal(3);
    });
  });

  describe("Merkle Root Anchoring", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should anchor student merkle root by institution", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const arweaveTxId = MockData.generateArweaveTxId("credentials");

      await expect(
        core.connect(institution1).anchorStudentMerkleRoot(
          merkleRoot,
          registration.uidHash,
          arweaveTxId,
          credentialIds
        )
      ).to.emit(core, "StudentMerkleRootAnchored");

      const anchor = await core.getStudentMerkleAnchor(merkleRoot);
      expect(anchor.uidHash).to.equal(registration.uidHash);
      expect(anchor.institution).to.equal(await institution1.getAddress());
      expect(anchor.credentialIds.length).to.equal(3);
      expect(await core.isStudentMerkleRootAnchored(merkleRoot)).to.be.true;
    });

    it("should fail to anchor duplicate merkle root", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const arweaveTxId = MockData.generateArweaveTxId("credentials");

      // First anchor
      await core.connect(institution1).anchorStudentMerkleRoot(
        merkleRoot,
        registration.uidHash,
        arweaveTxId,
        credentialIds
      );

      // Second anchor should fail
      await expect(
        core.connect(institution1).anchorStudentMerkleRoot(
          merkleRoot,
          registration.uidHash,
          arweaveTxId,
          credentialIds
        )
      ).to.be.revertedWith("Student merkle root already anchored");
    });

    it("should fail to anchor for unregistered UID", async function () {
      const { core, institution1 } = contracts;
      const unregisteredUID = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const arweaveTxId = MockData.generateArweaveTxId("credentials");

      await expect(
        core.connect(institution1).anchorStudentMerkleRoot(
          merkleRoot,
          unregisteredUID,
          arweaveTxId,
          credentialIds
        )
      ).to.be.revertedWith("Student UID not registered");
    });

    it("should fail to anchor with empty Arweave TX ID", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);

      await expect(
        core.connect(institution1).anchorStudentMerkleRoot(
          merkleRoot,
          registration.uidHash,
          "",
          credentialIds
        )
      ).to.be.revertedWith("Empty Arweave transaction ID");
    });

    it("should fail to anchor with no credential IDs", async function () {
      const { core, institution1, registrations } = contracts;
      const registration = registrations[0];
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const arweaveTxId = MockData.generateArweaveTxId("credentials");

      await expect(
        core.connect(institution1).anchorStudentMerkleRoot(
          merkleRoot,
          registration.uidHash,
          arweaveTxId,
          []
        )
      ).to.be.revertedWith("No credential IDs provided");
    });

    it("should fail to anchor by non-institution", async function () {
      const { core, student1, registrations } = contracts;
      const registration = registrations[0];
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const arweaveTxId = MockData.generateArweaveTxId("credentials");

      await expect(
        core.connect(student1).anchorStudentMerkleRoot(
          merkleRoot,
          registration.uidHash,
          arweaveTxId,
          credentialIds
        )
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Student Profile Management", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should update student wallet by student themselves", async function () {
      const { core, student1, student2, registrations } = contracts;
      const registration = registrations[0];
      const newWallet = await student2.getAddress();

      await expect(
        core.connect(student1).updateStudentWallet(registration.uidHash, newWallet)
      ).to.emit(core, "StudentProfileUpdated");

      const profile = await core.getStudentProfile(registration.uidHash);
      expect(profile.currentWallet).to.equal(newWallet);
      expect(profile.isActive).to.be.true;
    });

    it("should update student wallet by authorized institution", async function () {
      const { core, institution1, student2, registrations } = contracts;
      const registration = registrations[0];
      const newWallet = await student2.getAddress();

      await expect(
        core.connect(institution1).updateStudentWallet(registration.uidHash, newWallet)
      ).to.emit(core, "StudentProfileUpdated");

      const profile = await core.getStudentProfile(registration.uidHash);
      expect(profile.currentWallet).to.equal(newWallet);
    });

    it("should update student wallet by admin", async function () {
      const { core, admin, student2, registrations } = contracts;
      const registration = registrations[0];
      const newWallet = await student2.getAddress();

      await expect(
        core.connect(admin).updateStudentWallet(registration.uidHash, newWallet)
      ).to.emit(core, "StudentProfileUpdated");

      const profile = await core.getStudentProfile(registration.uidHash);
      expect(profile.currentWallet).to.equal(newWallet);
    });

    it("should fail to update wallet for unregistered UID", async function () {
      const { core, student1 } = contracts;
      const unregisteredUID = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));
      const newWallet = await student1.getAddress();

      await expect(
        core.connect(student1).updateStudentWallet(unregisteredUID, newWallet)
      ).to.be.revertedWith("Student UID not registered");
    });

    it("should fail to update wallet by unauthorized user", async function () {
      const { core, student1, student2, registrations } = contracts;
      const registration = registrations[0];
      const newWallet = await student2.getAddress();

      await expect(
        core.connect(student2).updateStudentWallet(registration.uidHash, newWallet)
      ).to.be.revertedWith("Not authorized to update wallet");
    });

    it("should create new profile when updating wallet for first time", async function () {
      const { core, student1, registrations } = contracts;
      const registration = registrations[1]; // Second registration without profile
      const wallet = await student1.getAddress();

      await core.connect(student1).updateStudentWallet(registration.uidHash, wallet);

      const profile = await core.getStudentProfile(registration.uidHash);
      expect(profile.uidHash).to.equal(registration.uidHash);
      expect(profile.currentWallet).to.equal(wallet);
      expect(profile.isActive).to.be.true;
      expect(profile.createdAt).to.be.greaterThan(0);
    });
  });

  describe("Academic Snapshot Creation", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should create academic snapshot by admin", async function () {
      const { core, admin, institution1, anchors } = contracts;
      const anchor = anchors[0];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(admin).createAcademicSnapshot(
          anchor.uidHash,
          metadataUri,
          anchor.merkleRoot,
          anchor.credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(core, "AcademicSnapshotCreated");

      const [verified, tokenId] = await core.verifyCredentialWithUID(anchor.uidHash, anchor.credentialIds[0]);
      expect(verified).to.be.true;
      expect(tokenId).to.be.greaterThanOrEqual(0);
    });

    it("should create academic snapshot by student themselves", async function () {
      const { core, student1, institution1, anchors } = contracts;
      const anchor = anchors[0];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(student1).createAcademicSnapshot(
          anchor.uidHash,
          metadataUri,
          anchor.merkleRoot,
          anchor.credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(core, "AcademicSnapshotCreated");
    });

    it("should create academic snapshot by authorized institution", async function () {
      const { core, institution1, anchors } = contracts;
      const anchor = anchors[0];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(institution1).createAcademicSnapshot(
          anchor.uidHash,
          metadataUri,
          anchor.merkleRoot,
          anchor.credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(core, "AcademicSnapshotCreated");
    });

    it("should fail to create snapshot for unregistered UID", async function () {
      const { core, admin, institution1 } = contracts;
      const unregisteredUID = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(admin).createAcademicSnapshot(
          unregisteredUID,
          metadataUri,
          merkleRoot,
          credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Student UID not registered");
    });

    it("should fail to create snapshot with unanchored merkle root", async function () {
      const { core, admin, institution1, registrations } = contracts;
      const registration = registrations[0];
      const unanchoredMerkleRoot = MockData.MOCK_MERKLE_DATA.root3;
      const credentialIds = MockData.generateCredentialIds(3);
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(admin).createAcademicSnapshot(
          registration.uidHash,
          metadataUri,
          unanchoredMerkleRoot,
          credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Student merkle root not anchored");
    });

    it("should fail to create snapshot with wrong merkle root for student", async function () {
      const { core, admin, institution1, anchors } = contracts;
      const anchor = anchors[0];
      const wrongMerkleRoot = MockData.MOCK_MERKLE_DATA.root2;
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(admin).createAcademicSnapshot(
          anchor.uidHash,
          metadataUri,
          wrongMerkleRoot,
          anchor.credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Merkle root doesn't belong to student");
    });

    it("should fail to create snapshot by unauthorized user", async function () {
      const { core, student2, institution1, anchors } = contracts;
      const anchor = anchors[0];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(student2).createAcademicSnapshot(
          anchor.uidHash,
          metadataUri,
          anchor.merkleRoot,
          anchor.credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Not authorized to create academic snapshot");
    });
  });

  describe("Credential Verification", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should verify credential with UID", async function () {
      const { core, anchors } = contracts;
      const anchor = anchors[0];

      const [verified, tokenId] = await core.verifyCredentialWithUID(anchor.uidHash, anchor.credentialIds[0]);
      expect(verified).to.be.true;
      expect(tokenId).to.be.greaterThanOrEqual(0);
    });

    it("should fail to verify credential for unregistered UID", async function () {
      const { core } = contracts;
      const unregisteredUID = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));

      await expect(
        core.verifyCredentialWithUID(unregisteredUID, "CRED_001")
      ).to.be.revertedWith("Student UID not registered");
    });

    it("should fail to verify credential for student with no NFTs", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[1]; // Second registration without NFT

      await expect(
        core.verifyCredentialWithUID(registration.uidHash, "CRED_001")
      ).to.be.revertedWith("Student has no academic NFTs");
    });
  });

  describe("Academic Profile Queries", function () {
    beforeEach(async function () {
      // Setup complete environment
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);
    });

    it("should get complete academic profile", async function () {
      const { core, anchors } = contracts;
      const anchor = anchors[0];

      const [uidHash, tokenIds, hasActiveUID, currentWallet] = await core.getStudentAcademicProfile(anchor.uidHash);

      expect(uidHash).to.equal(anchor.uidHash);
      expect(tokenIds.length).to.be.greaterThan(0);
      expect(hasActiveUID).to.be.true;
      expect(currentWallet).to.not.equal(ethers.ZeroAddress);
    });

    it("should get student profile", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[0];

      const profile = await core.getStudentProfile(registration.uidHash);

      expect(profile.uidHash).to.equal(registration.uidHash);
      expect(profile.isActive).to.be.true;
      expect(profile.createdAt).to.be.greaterThan(0);
    });

    it("should fail to get profile for non-existing student", async function () {
      const { core } = contracts;
      const nonExistingUID = ethers.keccak256(ethers.toUtf8Bytes("non-existing"));

      await expect(
        core.getStudentProfile(nonExistingUID)
      ).to.be.revertedWith("Student profile not found");
    });
  });

  describe("Data Query Functions", function () {
    beforeEach(async function () {
      // Setup complete environment with multiple updates
      const environment = await TestSetup.setupCompleteEnvironment();
      Object.assign(contracts, environment);

      // Add multiple data updates
      const { core, updater1, registrations } = contracts;
      const registration = registrations[0];

      // Add grades update
      await core.connect(updater1).updateStudentData(
        registration.uidHash,
        mockStreamData.grades.type,
        MockData.generateArweaveTxId("grades"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("grades-v1"))
      );

      // Add attendance update
      await core.connect(updater1).updateStudentData(
        registration.uidHash,
        mockStreamData.attendance.type,
        MockData.generateArweaveTxId("attendance"),
        ethers.keccak256(ethers.toUtf8Bytes("grades-v1")),
        ethers.keccak256(ethers.toUtf8Bytes("attendance-v1"))
      );

      // Add assignments update
      await core.connect(updater1).updateStudentData(
        registration.uidHash,
        mockStreamData.assignments.type,
        MockData.generateArweaveTxId("assignments"),
        ethers.keccak256(ethers.toUtf8Bytes("attendance-v1")),
        ethers.keccak256(ethers.toUtf8Bytes("assignments-v1"))
      );
    });

    it("should get data updates in range", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[0];

      const updates = await core.getStudentDataUpdatesRange(registration.uidHash, 1, 2);

      expect(updates.length).to.equal(2);
      expect(updates[0].updateIndex).to.equal(1);
      expect(updates[1].updateIndex).to.equal(2);
    });

    it("should get data updates by type", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[0];

      const gradesUpdates = await core.getStudentDataUpdatesByType(registration.uidHash, mockStreamData.grades.type);

      expect(gradesUpdates.length).to.equal(1);
      expect(gradesUpdates[0].dataType).to.equal(mockStreamData.grades.type);
    });

    it("should get latest data update", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[0];

      const latestUpdate = await core.getLatestStudentDataUpdate(registration.uidHash);

      expect(latestUpdate.updateIndex).to.equal(3);
      expect(latestUpdate.dataType).to.equal(mockStreamData.assignments.type);
    });

    it("should get data update count", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[0];

      const updateCount = await core.getStudentDataUpdateCount(registration.uidHash);

      expect(updateCount).to.equal(3);
    });

    it("should fail to get updates for uninitialized stream", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[1]; // Second registration without initialized stream

      await expect(
        core.getStudentDataUpdatesRange(registration.uidHash, 1, 2)
      ).to.be.revertedWith("Student data stream not found");
    });

    it("should fail to get updates with invalid range", async function () {
      const { core, registrations } = contracts;
      const registration = registrations[0];

      await expect(
        core.getStudentDataUpdatesRange(registration.uidHash, 0, 5)
      ).to.be.revertedWith("Invalid range");
    });
  });

  describe("Contract Management", function () {
    it("should update contract addresses by admin", async function () {
      const { admin, core, uid, nft } = contracts;

      await expect(
        core.connect(admin).updateContractAddresses(await uid.getAddress(), await nft.getAddress())
      ).to.emit(core, "ContractAddressesUpdated");
    });

    it("should fail to update contract addresses by non-admin", async function () {
      const { student1, core, uid, nft } = contracts;

      await expect(
        core.connect(student1).updateContractAddresses(await uid.getAddress(), await nft.getAddress())
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");
    });

    it("should fail to update with invalid UID contract address", async function () {
      const { admin, core, nft } = contracts;

      await expect(
        core.connect(admin).updateContractAddresses(ethers.ZeroAddress, await nft.getAddress())
      ).to.be.revertedWith("Invalid UID contract address");
    });

    it("should fail to update with invalid NFT contract address", async function () {
      const { admin, core, uid } = contracts;

      await expect(
        core.connect(admin).updateContractAddresses(await uid.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid NFT contract address");
    });

    it("should pause and unpause contract by admin", async function () {
      const { admin, core } = contracts;

      await core.connect(admin).pause();
      expect(await core.paused()).to.be.true;

      await core.connect(admin).unpause();
      expect(await core.paused()).to.be.false;
    });

    it("should fail to pause by non-admin", async function () {
      const { student1, core } = contracts;

      await expect(
        core.connect(student1).pause()
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");
    });
  });
});
