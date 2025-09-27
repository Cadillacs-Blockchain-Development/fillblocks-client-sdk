import { expect } from "chai";
import { ethers } from "hardhat";
import { MockData } from "../../helpers/MockData";
import { TestSetup } from "../../helpers/TestSetup";

describe("Full PhilBlocks System Integration E2E Tests", function () {
  let contracts: any;
  let mockUsers: any;
  let mockInstitutions: any;

  beforeEach(async function () {
    // Setup complete environment with all contracts and mock data
    const environment = await TestSetup.setupCompleteEnvironment();
    contracts = environment;
    mockUsers = MockData.MOCK_USERS;
    mockInstitutions = MockData.MOCK_INSTITUTIONS;
  });

  describe("Complete Student Journey", function () {
    it("should complete full student journey from registration to graduation", async function () {
      const { 
        student1, 
        institution1, 
        updater1, 
        admin, 
        uid, 
        core, 
        nft
      } = contracts;

      const studentAddress = await student1.getAddress();
      const institutionAddress = await institution1.getAddress();

      // Step 1: Register UID for student
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

      // Step 3: Update student profile in Core
      await core.connect(student1).updateStudentWallet(uidHash, studentAddress);
      const profile = await core.getStudentProfile(uidHash);
      expect(profile.currentWallet).to.equal(studentAddress);

      // Step 4: Initialize student data stream
      const initialTxId = MockData.generateArweaveTxId("initial");
      await core.connect(institution1).initializeStudentDataStream(uidHash, initialTxId);

      // Step 5: Update student data throughout semester
      const gradesTxId = MockData.generateArweaveTxId("grades");
      await core.connect(updater1).updateStudentData(
        uidHash,
        MockData.MOCK_STREAM_DATA.grades.type,
        gradesTxId,
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("grades-sem1"))
      );

      const attendanceTxId = MockData.generateArweaveTxId("attendance");
      await core.connect(updater1).updateStudentData(
        uidHash,
        MockData.MOCK_STREAM_DATA.attendance.type,
        attendanceTxId,
        ethers.keccak256(ethers.toUtf8Bytes("grades-sem1")),
        ethers.keccak256(ethers.toUtf8Bytes("attendance-sem1"))
      );

      // Step 6: Anchor merkle root for final credentials
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const credentialsTxId = MockData.generateArweaveTxId("credentials");

      await core.connect(institution1).anchorStudentMerkleRoot(
        merkleRoot,
        uidHash,
        credentialsTxId,
        credentialIds
      );

      // Step 7: Create academic snapshot (graduation)
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      await expect(
        core.connect(admin).createAcademicSnapshot(
          uidHash,
          metadataUri,
          merkleRoot,
          credentialIds,
          institutionAddress,
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(core, "AcademicSnapshotCreated");

      // Step 8: Verify credential
      const [verified, tokenId] = await core.verifyCredentialWithUID(uidHash, credentialIds[0]);
      expect(verified).to.be.true;
      expect(tokenId).to.be.greaterThanOrEqual(0);

      // Step 9: Verify complete academic profile
      const [profileUidHash, tokenIds, hasActiveUID, currentWallet] = await core.getStudentAcademicProfile(uidHash);
      expect(profileUidHash).to.equal(uidHash);
      expect(tokenIds.length).to.be.greaterThan(0);
      expect(hasActiveUID).to.be.true;
      expect(currentWallet).to.equal(studentAddress);

      // Step 10: Verify NFT ownership
      const nftBalance = await nft.balanceOf(studentAddress);
      expect(nftBalance).to.be.greaterThan(0);

      const latestNFT = await nft.getStudentLatestNFT(studentAddress);
      const snapshot = await nft.getAcademicSnapshot(latestNFT);
      expect(snapshot.academicLevel).to.equal(academicData.level);
      expect(snapshot.fieldOfStudy).to.equal(academicData.field);
    });

    it("should handle multiple students with different institutions", async function () {
      const { 
        student1, 
        student2, 
        institution1, 
        institution2, 
        updater1, 
        updater2, 
        admin, 
        uid, 
        core, 
        nft 
      } = contracts;

      // Register both students
      const students = [
        { signer: student1, ...mockUsers.student1 },
        { signer: student2, ...mockUsers.student2 }
      ];

      const registrations = await TestSetup.registerMockStudents(uid, students);
      await TestSetup.setupStudentProfiles(core, registrations);

      // Initialize data streams for both students
      await TestSetup.initializeDataStreams(core, institution1, registrations.slice(0, 1));
      await TestSetup.initializeDataStreams(core, institution2, registrations.slice(1, 2));

      // Update data for both students
      await core.connect(updater1).updateStudentData(
        registrations[0].uidHash,
        MockData.MOCK_STREAM_DATA.grades.type,
        MockData.generateArweaveTxId("student1-grades"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("student1-grades"))
      );

      await core.connect(updater2).updateStudentData(
        registrations[1].uidHash,
        MockData.MOCK_STREAM_DATA.grades.type,
        MockData.generateArweaveTxId("student2-grades"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("student2-grades"))
      );

      // Create merkle anchors for both students
      const anchors = await TestSetup.createMockMerkleAnchors(core, institution1, registrations);

      // Create academic snapshots for both students
      const snapshots = await TestSetup.createMockAcademicSnapshots(core, admin, institution1, anchors);

      // Verify both students have NFTs
      expect(snapshots.length).to.equal(2);
      expect(snapshots[0].tokenId).to.be.greaterThanOrEqual(0);
      expect(snapshots[1].tokenId).to.be.greaterThanOrEqual(0);

      // Verify both students can verify credentials
      const [verified1, tokenId1] = await core.verifyCredentialWithUID(registrations[0].uidHash, anchors[0].credentialIds[0]);
      const [verified2, tokenId2] = await core.verifyCredentialWithUID(registrations[1].uidHash, anchors[1].credentialIds[0]);

      expect(verified1).to.be.true;
      expect(verified2).to.be.true;
      expect(tokenId1).to.not.equal(tokenId2);
    });
  });

  describe("Institution Management Flow", function () {
    it("should handle institution authorization and role management", async function () {
      const { 
        admin, 
        institution1, 
        institution2, 
        uid, 
        core 
      } = contracts;

      // Authorize institutions in UID contract
      await uid.connect(admin).grantInstitutionRole(await institution1.getAddress(), true);
      await uid.connect(admin).grantInstitutionRole(await institution2.getAddress(), true);

      expect(await uid.isAuthorizedInstitution(await institution1.getAddress())).to.be.true;
      expect(await uid.isAuthorizedInstitution(await institution2.getAddress())).to.be.true;

      // Grant institution roles in Core contract
      await core.connect(admin).grantInstitutionRole(await institution1.getAddress());
      await core.connect(admin).grantInstitutionRole(await institution2.getAddress());

      expect(await core.hasRole(await core.INSTITUTION_ROLE(), await institution1.getAddress())).to.be.true;
      expect(await core.hasRole(await core.INSTITUTION_ROLE(), await institution2.getAddress())).to.be.true;

      // Grant updater roles
      await core.connect(admin).grantUpdaterRole(await institution1.getAddress());
      await core.connect(admin).grantUpdaterRole(await institution2.getAddress());

      expect(await core.hasRole(await core.UPDATER_ROLE(), await institution1.getAddress())).to.be.true;
      expect(await core.hasRole(await core.UPDATER_ROLE(), await institution2.getAddress())).to.be.true;

      // Test that both institutions can now manage students
      const students = [
        { signer: contracts.student1, ...mockUsers.student1 },
        { signer: contracts.student2, ...mockUsers.student2 }
      ];

      const registrations = await TestSetup.registerMockStudents(uid, students);
      await TestSetup.setupStudentProfiles(core, registrations);

      // Institution1 manages student1
      await core.connect(institution1).initializeStudentDataStream(
        registrations[0].uidHash,
        MockData.generateArweaveTxId("inst1-init")
      );

      // Institution2 manages student2
      await core.connect(institution2).initializeStudentDataStream(
        registrations[1].uidHash,
        MockData.generateArweaveTxId("inst2-init")
      );

      // Both institutions can update data
      await core.connect(institution1).updateStudentData(
        registrations[0].uidHash,
        "GRADES",
        MockData.generateArweaveTxId("inst1-grades"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("inst1-grades"))
      );

      await core.connect(institution2).updateStudentData(
        registrations[1].uidHash,
        "GRADES",
        MockData.generateArweaveTxId("inst2-grades"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("inst2-grades"))
      );
    });

    it("should handle institution role revocation", async function () {
      const { 
        admin, 
        institution1, 
        institution2, 
        uid, 
        core 
      } = contracts;

      // Setup institutions
      await uid.connect(admin).grantInstitutionRole(await institution1.getAddress(), true);
      await uid.connect(admin).grantInstitutionRole(await institution2.getAddress(), true);
      await core.connect(admin).grantInstitutionRole(await institution1.getAddress());
      await core.connect(admin).grantInstitutionRole(await institution2.getAddress());

      // Register a student
      const students = [{ signer: contracts.student1, ...mockUsers.student1 }];
      const registrations = await TestSetup.registerMockStudents(uid, students);
      await TestSetup.setupStudentProfiles(core, registrations);

      // Institution1 initializes stream
      await core.connect(institution1).initializeStudentDataStream(
        registrations[0].uidHash,
        MockData.generateArweaveTxId("init")
      );

      // Revoke institution1's role
      await core.connect(admin).revokeInstitutionRole(await institution1.getAddress());
      await uid.connect(admin).revokeInstitutionRole(await institution1.getAddress());

      // Institution1 should no longer be able to update data
      await expect(
        core.connect(institution1).updateStudentData(
          registrations[0].uidHash,
          "GRADES",
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWithCustomError(core, "AccessControlUnauthorizedAccount");

      // Institution2 should still be able to update data
      await core.connect(institution2).updateStudentData(
        registrations[0].uidHash,
        "GRADES",
        MockData.generateArweaveTxId("update"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("grades"))
      );
    });
  });

  describe("Recovery System Integration", function () {
    it("should handle complete recovery flow", async function () {
      const { 
        student1, 
        student2, 
        institution1, 
        admin, 
        uid 
      } = contracts;

      // Register student
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

      // Set recovery method
      const recoveryMethod = MockData.MOCK_RECOVERY_DATA.email.method;
      const recoveryHash = MockData.MOCK_RECOVERY_DATA.email.hash;
      await uid.connect(student1).setRecoveryMethod(uidHash, recoveryMethod, recoveryHash);

      // Request recovery
      const nationalIDHash = ethers.keccak256(ethers.toUtf8Bytes(mockUsers.student1.nationalID));
      const salt = mockUsers.student1.salt;

      await uid.connect(student1).requestRecovery(nationalIDHash, salt, recoveryMethod);

      // Verify recovery request exists
      const recoveryId = ethers.keccak256(ethers.toUtf8Bytes(nationalIDHash + salt));
      const recoveryData = await uid.getRecoveryData(recoveryId);
      expect(recoveryData.recoveryMethod).to.equal(recoveryMethod);
      expect(recoveryData.verified).to.be.false;

      // Complete recovery with institution signature
      const newAddress = await student2.getAddress();
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(recoveryId + newAddress));
      const signature = await institution1.signMessage(ethers.getBytes(messageHash));

      await uid.connect(admin).completeRecovery(nationalIDHash, salt, newAddress, signature);

      // Verify new address has the UID
      expect(await uid.hasUID(newAddress)).to.be.true;
      expect(await uid.getUIDByAddress(newAddress)).to.equal(uidHash);

      // Verify old address no longer has UID
      expect(await uid.hasUID(await student1.getAddress())).to.be.false;
    });
  });

  describe("NFT and Credential Management", function () {
    it("should handle multiple academic achievements for same student", async function () {
      const { 
        student1, 
        institution1, 
        admin, 
        core, 
        nft 
      } = contracts;

      // Setup student
      const students = [{ signer: student1, ...mockUsers.student1 }];
      const registrations = await TestSetup.registerMockStudents(contracts.uid, students);
      await TestSetup.setupStudentProfiles(core, registrations);
      await TestSetup.initializeDataStreams(core, institution1, registrations);

      const uidHash = registrations[0].uidHash;

      // Create multiple merkle anchors for different achievements
      const bachelorRoot = MockData.MOCK_MERKLE_DATA.root1;
      const masterRoot = MockData.MOCK_MERKLE_DATA.root2;
      const doctorateRoot = MockData.MOCK_MERKLE_DATA.root3;

      // Bachelor degree
      await core.connect(institution1).anchorStudentMerkleRoot(
        bachelorRoot,
        uidHash,
        MockData.generateArweaveTxId("bachelor-credentials"),
        ["BACHELOR_DIPLOMA", "BACHELOR_TRANSCRIPT"]
      );

      // Master degree
      await core.connect(institution1).anchorStudentMerkleRoot(
        masterRoot,
        uidHash,
        MockData.generateArweaveTxId("master-credentials"),
        ["MASTER_DIPLOMA", "MASTER_TRANSCRIPT"]
      );

      // Doctorate degree
      await core.connect(institution1).anchorStudentMerkleRoot(
        doctorateRoot,
        uidHash,
        MockData.generateArweaveTxId("doctorate-credentials"),
        ["DOCTORATE_DIPLOMA", "DOCTORATE_TRANSCRIPT"]
      );

      // Create academic snapshots for each degree
      const bachelorSnapshot = await core.connect(admin).createAcademicSnapshot(
        uidHash,
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        bachelorRoot,
        ["BACHELOR_DIPLOMA", "BACHELOR_TRANSCRIPT"],
        await institution1.getAddress(),
        MockData.MOCK_ACADEMIC_DATA.bachelor.level,
        MockData.MOCK_ACADEMIC_DATA.bachelor.field,
        MockData.MOCK_ACADEMIC_DATA.bachelor.graduationDate
      );

      const masterSnapshot = await core.connect(admin).createAcademicSnapshot(
        uidHash,
        MockData.MOCK_ARWEAVE_DATA.credentials.uri,
        masterRoot,
        ["MASTER_DIPLOMA", "MASTER_TRANSCRIPT"],
        await institution1.getAddress(),
        MockData.MOCK_ACADEMIC_DATA.master.level,
        MockData.MOCK_ACADEMIC_DATA.master.field,
        MockData.MOCK_ACADEMIC_DATA.master.graduationDate
      );

      const doctorateSnapshot = await core.connect(admin).createAcademicSnapshot(
        uidHash,
        MockData.MOCK_ARWEAVE_DATA.transcript.uri,
        doctorateRoot,
        ["DOCTORATE_DIPLOMA", "DOCTORATE_TRANSCRIPT"],
        await institution1.getAddress(),
        MockData.MOCK_ACADEMIC_DATA.doctorate.level,
        MockData.MOCK_ACADEMIC_DATA.doctorate.field,
        MockData.MOCK_ACADEMIC_DATA.doctorate.graduationDate
      );

      // Verify all NFTs were created
      const studentNFTs = await nft.getStudentNFTs(await student1.getAddress());
      expect(studentNFTs.length).to.equal(3);

      // Verify all credentials can be verified
      const [bachelorVerified, bachelorTokenId] = await core.verifyCredentialWithUID(uidHash, "BACHELOR_DIPLOMA");
      const [masterVerified, masterTokenId] = await core.verifyCredentialWithUID(uidHash, "MASTER_DIPLOMA");
      const [doctorateVerified, doctorateTokenId] = await core.verifyCredentialWithUID(uidHash, "DOCTORATE_DIPLOMA");

      expect(bachelorVerified).to.be.true;
      expect(masterVerified).to.be.true;
      expect(doctorateVerified).to.be.true;

      // Verify different token IDs
      expect(bachelorTokenId).to.not.equal(masterTokenId);
      expect(masterTokenId).to.not.equal(doctorateTokenId);
      expect(bachelorTokenId).to.not.equal(doctorateTokenId);
    });
  });

  describe("System Pause and Recovery", function () {
    it("should handle system pause and unpause", async function () {
      const { 
        admin, 
        core, 
        institution1, 
        registrations 
      } = contracts;

      // Pause the system
      await core.connect(admin).pause();
      expect(await core.paused()).to.be.true;

      // System operations should fail when paused
      await expect(
        core.connect(institution1).initializeStudentDataStream(
          registrations[0].uidHash,
          MockData.generateArweaveTxId("init")
        )
      ).to.be.revertedWith("Pausable: paused");

      await expect(
        core.connect(contracts.updater1).updateStudentData(
          registrations[0].uidHash,
          "GRADES",
          MockData.generateArweaveTxId("update"),
          ethers.ZeroHash,
          ethers.keccak256(ethers.toUtf8Bytes("grades"))
        )
      ).to.be.revertedWith("Pausable: paused");

      // Unpause the system
      await core.connect(admin).unpause();
      expect(await core.paused()).to.be.false;

      // System operations should work again
      await core.connect(institution1).initializeStudentDataStream(
        registrations[0].uidHash,
        MockData.generateArweaveTxId("init")
      );

      await core.connect(contracts.updater1).updateStudentData(
        registrations[0].uidHash,
        "GRADES",
        MockData.generateArweaveTxId("update"),
        ethers.ZeroHash,
        ethers.keccak256(ethers.toUtf8Bytes("grades"))
      );
    });
  });

  describe("Data Integrity and Verification", function () {
    it("should maintain data integrity across all operations", async function () {
      const { 
        student1, 
        institution1, 
        updater1, 
        admin, 
        core, 
        nft 
      } = contracts;

      const uidHash = contracts.registrations[0].uidHash;

      // Perform multiple data updates
      const updates = [
        { type: "GRADES", data: "grades-sem1" },
        { type: "ATTENDANCE", data: "attendance-sem1" },
        { type: "ASSIGNMENTS", data: "assignments-sem1" },
        { type: "GRADES", data: "grades-sem2" },
        { type: "ATTENDANCE", data: "attendance-sem2" }
      ];

      let previousHash = ethers.ZeroHash;
      for (const update of updates) {
        const currentHash = ethers.keccak256(ethers.toUtf8Bytes(update.data));
        
        await core.connect(updater1).updateStudentData(
          uidHash,
          update.type,
          MockData.generateArweaveTxId(update.type.toLowerCase()),
          previousHash,
          currentHash
        );

        previousHash = currentHash;
      }

      // Verify all updates were recorded
      const updateCount = await core.getStudentDataUpdateCount(uidHash);
      expect(updateCount).to.equal(updates.length);

      // Verify specific update types
      const gradesUpdates = await core.getStudentDataUpdatesByType(uidHash, "GRADES");
      expect(gradesUpdates.length).to.equal(2);

      const attendanceUpdates = await core.getStudentDataUpdatesByType(uidHash, "ATTENDANCE");
      expect(attendanceUpdates.length).to.equal(2);

      const assignmentUpdates = await core.getStudentDataUpdatesByType(uidHash, "ASSIGNMENTS");
      expect(assignmentUpdates.length).to.equal(1);

      // Verify latest update
      const latestUpdate = await core.getLatestStudentDataUpdate(uidHash);
      expect(latestUpdate.dataType).to.equal("ATTENDANCE");
      expect(latestUpdate.updateIndex).to.equal(updates.length);

      // Verify data stream information
      const stream = await core.getStudentDataStream(uidHash);
      expect(stream.totalUpdates).to.equal(updates.length);
      expect(stream.isActive).to.be.true;
    });
  });
});
