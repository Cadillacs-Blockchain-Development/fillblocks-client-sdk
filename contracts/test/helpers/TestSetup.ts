import { ethers } from "hardhat";
import { MockData } from "./MockData";

/**
 * @title TestSetup
 * @dev Helper class for setting up comprehensive test environments
 */
export class TestSetup {
  static async deployAllContracts() {
    const [deployer, admin, institution1, institution2, student1, student2, updater1, updater2] = await ethers.getSigners();

    // Deploy MockVerifier
    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    const verifier = await MockVerifier.deploy();
    await verifier.waitForDeployment();

    // Deploy PhilBlocksUID implementation
    const PhilBlocksUID = await ethers.getContractFactory("PhilBlocksUID");
    const uidImplementation = await PhilBlocksUID.deploy();
    await uidImplementation.waitForDeployment();

    // Deploy proxy for PhilBlocksUID
    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const initData = PhilBlocksUID.interface.encodeFunctionData("initialize", [await verifier.getAddress(), await admin.getAddress()]);
    const uidProxy = await ERC1967Proxy.deploy(await uidImplementation.getAddress(), initData);
    await uidProxy.waitForDeployment();
    
    // Get the proxy contract instance
    const uid = PhilBlocksUID.attach(await uidProxy.getAddress());

    // Deploy AcademicJourneyNFT
    const AcademicJourneyNFT = await ethers.getContractFactory("AcademicJourneyNFT");
    const nft = await AcademicJourneyNFT.deploy("PhilBlocks Academic Journey", "PBEDU", await admin.getAddress());
    await nft.waitForDeployment();

    // Deploy PhilBlocksCore
    const PhilBlocksCore = await ethers.getContractFactory("PhilBlocksCore");
    const core = await PhilBlocksCore.deploy(
      await uid.getAddress(),
      await nft.getAddress(),
      await admin.getAddress()
    );
    await core.waitForDeployment();

    return {
      deployer,
      admin,
      institution1,
      institution2,
      student1,
      student2,
      updater1,
      updater2,
      verifier,
      uid,
      nft,
      core
    };
  }

  static async setupMockVerification(uid: any, admin: any) {
    await uid.connect(admin).setMockVerificationEnabled(true);
  }

  static async setupInstitutions(uid: any, core: any, institution1: any, institution2: any, admin: any) {
    // Authorize institutions in UID contract
    await uid.connect(admin).grantInstitutionRole(await institution1.getAddress());
    await uid.connect(admin).grantInstitutionRole(await institution2.getAddress());

    // Grant institution roles in Core contract
    await core.connect(admin).grantInstitutionRole(await institution1.getAddress());
    await core.connect(admin).grantInstitutionRole(await institution2.getAddress());
  }

  static async setupUpdaters(core: any, updater1: any, updater2: any, admin: any) {
    await core.connect(admin).grantUpdaterRole(await updater1.getAddress());
    await core.connect(admin).grantUpdaterRole(await updater2.getAddress());
  }

  static async setupAuthorizedMinters(nft: any, admin: any, institution1: any, institution2: any) {
    // Grant institution roles in NFT contract using new role management
    await nft.connect(admin).grantInstitutionRole(await institution1.getAddress());
    await nft.connect(admin).grantInstitutionRole(await institution2.getAddress());
  }

  static async registerMockStudents(uid: any, students: any[]) {
    const registrations = [];
    
    for (const student of students) {
      const uidHash = MockData.generateUIDHash(student.nationalID, student.salt);
      const institutionHash = MockData.generateInstitutionHash(student.institutionId);
      const proof = MockData.generateMockProof(uidHash, institutionHash);

      const tx = await uid.connect(student.signer).registerUID(
        uidHash,
        institutionHash,
        proof.a as any,
        proof.b as any,
        proof.c as any,
        proof.input as any
      );

      registrations.push({
        student: student.signer,
        uidHash,
        institutionHash,
        tx
      });
    }

    return registrations;
  }

  static async setupStudentProfiles(core: any, registrations: any[]) {
    for (const registration of registrations) {
      await core.updateStudentWallet(
        registration.uidHash,
        await registration.student.getAddress()
      );
    }
  }

  static async initializeDataStreams(core: any, institution: any, registrations: any[]) {
    for (const registration of registrations) {
      const initialTxId = MockData.generateArweaveTxId("init");
      await core.connect(institution).initializeStudentDataStream(
        registration.uidHash,
        initialTxId
      );
    }
  }

  static async createMockMerkleAnchors(core: any, institution: any, registrations: any[]) {
    const anchors = [];
    
    for (const registration of registrations) {
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const credentialIds = MockData.generateCredentialIds(3);
      const arweaveTxId = MockData.generateArweaveTxId("credentials");

      await core.connect(institution).anchorStudentMerkleRoot(
        merkleRoot,
        registration.uidHash,
        arweaveTxId,
        credentialIds
      );

      anchors.push({
        uidHash: registration.uidHash,
        merkleRoot,
        credentialIds,
        arweaveTxId
      });
    }

    return anchors;
  }

  static async createMockAcademicSnapshots(core: any, admin: any, institution: any, anchors: any[]) {
    const snapshots = [];
    
    for (const anchor of anchors) {
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const academicData = MockData.MOCK_ACADEMIC_DATA.bachelor;

      const tx = await core.connect(admin).createAcademicSnapshot(
        anchor.uidHash,
        metadataUri,
        anchor.merkleRoot,
        anchor.credentialIds,
        await institution.getAddress(),
        academicData.level,
        academicData.field,
        academicData.graduationDate
      );

      const receipt = await tx.wait();
      const event = receipt!.logs.find((l: any) => l.fragment && l.fragment.name === "AcademicSnapshotCreated");
      
      snapshots.push({
        uidHash: anchor.uidHash,
        tokenId: event?.args?.tokenId,
        merkleRoot: anchor.merkleRoot,
        metadataUri
      });
    }

    return snapshots;
  }

  static async setupCompleteEnvironment() {
    const contracts = await this.deployAllContracts();
    
    // Setup mock verification
    await this.setupMockVerification(contracts.uid);
    
    // Setup institutions and updaters
    await this.setupInstitutions(contracts.uid, contracts.core, contracts.institution1, contracts.institution2);
    await this.setupUpdaters(contracts.core, contracts.updater1, contracts.updater2);
    await this.setupAuthorizedMinters(contracts.nft, contracts.admin, contracts.institution1, contracts.institution2);
    
    // Register mock students
    const students = [
      { signer: contracts.student1, ...MockData.MOCK_USERS.student1 },
      { signer: contracts.student2, ...MockData.MOCK_USERS.student2 }
    ];
    
    const registrations = await this.registerMockStudents(contracts.uid, students);
    
    // Setup student profiles
    await this.setupStudentProfiles(contracts.core, registrations);
    
    // Initialize data streams
    await this.initializeDataStreams(contracts.core, contracts.institution1, registrations);
    
    // Create merkle anchors
    const anchors = await this.createMockMerkleAnchors(contracts.core, contracts.institution1, registrations);
    
    // Create academic snapshots
    const snapshots = await this.createMockAcademicSnapshots(contracts.core, contracts.admin, contracts.institution1, anchors);
    
    return {
      ...contracts,
      students,
      registrations,
      anchors,
      snapshots
    };
  }
}
