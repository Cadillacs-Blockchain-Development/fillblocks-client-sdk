import { expect } from "chai";
import { ethers } from "hardhat";
import { MockData } from "../../helpers/MockData";
import { TestSetup } from "../../helpers/TestSetup";

describe("AcademicJourneyNFT Comprehensive E2E Tests", function () {
  let contracts: any;
  let mockUsers: any;
  let mockInstitutions: any;
  let mockAcademicData: any;
  let mockCredentials: any;

  beforeEach(async function () {
    contracts = await TestSetup.deployAllContracts();
    mockUsers = MockData.MOCK_USERS;
    mockInstitutions = MockData.MOCK_INSTITUTIONS;
    mockAcademicData = MockData.MOCK_ACADEMIC_DATA;
    mockCredentials = MockData.MOCK_CREDENTIALS;
  });

  describe("NFT Minting - Basic", function () {
    beforeEach(async function () {
      await TestSetup.setupAuthorizedMinters(
        contracts.nft,
        contracts.admin,
        contracts.institution1,
        contracts.institution2
      );
    });

    it("should mint academic snapshot by owner", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id, mockCredentials.transcript.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(nft, "AcademicSnapshotMinted");

      const tokenId = await nft.getStudentLatestNFT(await student1.getAddress());
      expect(tokenId).to.equal(0);

      const snapshot = await nft.getAcademicSnapshot(tokenId);
      expect(snapshot.academicLevel).to.equal(academicData.level);
      expect(snapshot.fieldOfStudy).to.equal(academicData.field);
      expect(snapshot.graduationDate).to.equal(academicData.graduationDate);
      expect(snapshot.merkleRoot).to.equal(merkleRoot);
      expect(snapshot.credentialIds.length).to.equal(2);
    });

    it("should mint academic snapshot by authorized minter", async function () {
      const { institution1, student1, nft } = contracts;
      const academicData = mockAcademicData.master;
      const credentialIds = [mockCredentials.certificate.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.credentials.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root2;

      await expect(
        nft.connect(institution1).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          await institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(nft, "AcademicSnapshotMinted");

      const tokenId = await nft.getStudentLatestNFT(await student1.getAddress());
      expect(tokenId).to.equal(0);
    });

    it("should fail to mint by unauthorized minter", async function () {
      const { student1, student2, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(student2).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Not authorized to mint");
    });

    it("should fail to mint with invalid student address", async function () {
      const { admin, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          ethers.ZeroAddress,
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Invalid student address");
    });

    it("should fail to mint with empty metadata URI", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          "",
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Empty metadata URI");
    });

    it("should fail to mint with no credentials", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          [],
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("No credentials provided");
    });

    it("should fail to mint with invalid institution address", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          ethers.ZeroAddress,
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Invalid institution address");
    });

    it("should fail to mint with empty academic level", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          "",
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Empty academic level");
    });

    it("should fail to mint with empty field of study", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          "",
          academicData.graduationDate
        )
      ).to.be.revertedWith("Empty field of study");
    });

    it("should fail to mint with invalid graduation date", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshot(
          await student1.getAddress(),
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          0
        )
      ).to.be.revertedWith("Invalid graduation date");
    });
  });

  describe("NFT Minting - With UID", function () {
    beforeEach(async function () {
      await TestSetup.setupAuthorizedMinters(
        contracts.nft,
        contracts.admin,
        contracts.institution1,
        contracts.institution2
      );
    });

    it("should mint academic snapshot with UID tracking", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id, mockCredentials.transcript.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;
      const studentUID = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);

      await expect(
        nft.connect(admin).mintAcademicSnapshotWithUID(
          await student1.getAddress(),
          studentUID,
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.emit(nft, "UIDNFTCreated");

      const tokenId = await nft.getStudentLatestNFT(await student1.getAddress());
      const snapshot = await nft.getAcademicSnapshot(tokenId);
      expect(snapshot.studentUID).to.equal(studentUID);

      const uidNFTs = await nft.getUIDNFTs(studentUID);
      expect(uidNFTs.length).to.equal(1);
      expect(uidNFTs[0]).to.equal(tokenId);
    });

    it("should fail to mint with UID using invalid UID", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;
      const credentialIds = [mockCredentials.diploma.id];
      const metadataUri = MockData.MOCK_ARWEAVE_DATA.metadata.uri;
      const merkleRoot = MockData.MOCK_MERKLE_DATA.root1;

      await expect(
        nft.connect(admin).mintAcademicSnapshotWithUID(
          await student1.getAddress(),
          ethers.ZeroHash,
          metadataUri,
          merkleRoot,
          credentialIds,
          await contracts.institution1.getAddress(),
          academicData.level,
          academicData.field,
          academicData.graduationDate
        )
      ).to.be.revertedWith("Invalid student UID");
    });

    it("should track multiple NFTs per UID", async function () {
      const { admin, student1, nft } = contracts;
      const studentUID = MockData.generateUIDHash(mockUsers.student1.nationalID, mockUsers.student1.salt);

      // Mint first NFT
      await nft.connect(admin).mintAcademicSnapshotWithUID(
        await student1.getAddress(),
        studentUID,
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        MockData.MOCK_MERKLE_DATA.root1,
        [mockCredentials.diploma.id],
        await contracts.institution1.getAddress(),
        mockAcademicData.bachelor.level,
        mockAcademicData.bachelor.field,
        mockAcademicData.bachelor.graduationDate
      );

      // Mint second NFT
      await nft.connect(admin).mintAcademicSnapshotWithUID(
        await student1.getAddress(),
        studentUID,
        MockData.MOCK_ARWEAVE_DATA.credentials.uri,
        MockData.MOCK_MERKLE_DATA.root2,
        [mockCredentials.certificate.id],
        await contracts.institution1.getAddress(),
        mockAcademicData.master.level,
        mockAcademicData.master.field,
        mockAcademicData.master.graduationDate
      );

      const uidNFTs = await nft.getUIDNFTs(studentUID);
      expect(uidNFTs.length).to.equal(2);
    });
  });

  describe("Credential Verification", function () {
    let tokenId: number;
    let credentialIds: string[];

    beforeEach(async function () {
      await TestSetup.setupAuthorizedMinters(
        contracts.nft,
        contracts.admin,
        contracts.institution1,
        contracts.institution2
      );

      // Mint an NFT for testing
      credentialIds = [mockCredentials.diploma.id, mockCredentials.transcript.id, mockCredentials.certificate.id];
      
      await contracts.nft.connect(contracts.admin).mintAcademicSnapshot(
        await contracts.student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        MockData.MOCK_MERKLE_DATA.root1,
        credentialIds,
        await contracts.institution1.getAddress(),
        mockAcademicData.bachelor.level,
        mockAcademicData.bachelor.field,
        mockAcademicData.bachelor.graduationDate
      );

      tokenId = await contracts.nft.getStudentLatestNFT(await contracts.student1.getAddress());
    });

    it("should verify existing credential", async function () {
      const { nft } = contracts;
      
      expect(await nft.verifyCredential(tokenId, mockCredentials.diploma.id)).to.be.true;
      expect(await nft.verifyCredential(tokenId, mockCredentials.transcript.id)).to.be.true;
      expect(await nft.verifyCredential(tokenId, mockCredentials.certificate.id)).to.be.true;
    });

    it("should fail to verify non-existing credential", async function () {
      const { nft } = contracts;
      
      expect(await nft.verifyCredential(tokenId, "NON_EXISTING_CREDENTIAL")).to.be.false;
    });

    it("should fail to verify credential for non-existing token", async function () {
      const { nft } = contracts;
      
      await expect(
        nft.verifyCredential(999, mockCredentials.diploma.id)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("NFT Data Queries", function () {
    let tokenId: number;

    beforeEach(async function () {
      await TestSetup.setupAuthorizedMinters(
        contracts.nft,
        contracts.admin,
        contracts.institution1,
        contracts.institution2
      );

      // Mint an NFT for testing
      await contracts.nft.connect(contracts.admin).mintAcademicSnapshot(
        await contracts.student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        MockData.MOCK_MERKLE_DATA.root1,
        [mockCredentials.diploma.id, mockCredentials.transcript.id],
        await contracts.institution1.getAddress(),
        mockAcademicData.bachelor.level,
        mockAcademicData.bachelor.field,
        mockAcademicData.bachelor.graduationDate
      );

      tokenId = await contracts.nft.getStudentLatestNFT(await contracts.student1.getAddress());
    });

    it("should get academic snapshot data", async function () {
      const { nft } = contracts;
      const snapshot = await nft.getAcademicSnapshot(tokenId);

      expect(snapshot.arweaveMetadataUri).to.equal(MockData.MOCK_ARWEAVE_DATA.metadata.uri);
      expect(snapshot.merkleRoot).to.equal(MockData.MOCK_MERKLE_DATA.root1);
      expect(snapshot.credentialIds.length).to.equal(2);
      expect(snapshot.academicLevel).to.equal(mockAcademicData.bachelor.level);
      expect(snapshot.fieldOfStudy).to.equal(mockAcademicData.bachelor.field);
      expect(snapshot.graduationDate).to.equal(mockAcademicData.bachelor.graduationDate);
      expect(snapshot.institution).to.equal(await contracts.institution1.getAddress());
    });

    it("should get student's latest NFT", async function () {
      const { nft, student1 } = contracts;
      const latestNFT = await nft.getStudentLatestNFT(await student1.getAddress());

      expect(latestNFT).to.equal(tokenId);
    });

    it("should get all NFTs owned by student", async function () {
      const { nft, student1 } = contracts;
      const studentNFTs = await nft.getStudentNFTs(await student1.getAddress());

      expect(studentNFTs.length).to.equal(1);
      expect(studentNFTs[0]).to.equal(tokenId);
    });

    it("should get merkle root for token", async function () {
      const { nft } = contracts;
      const merkleRoot = await nft.getMerkleRoot(tokenId);

      expect(merkleRoot).to.equal(MockData.MOCK_MERKLE_DATA.root1);
    });

    it("should get total supply", async function () {
      const { nft } = contracts;
      const totalSupply = await nft.totalSupply();

      expect(totalSupply).to.equal(1);
    });

    it("should fail to get academic snapshot for non-existing token", async function () {
      const { nft } = contracts;
      
      await expect(
        nft.getAcademicSnapshot(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("should fail to get merkle root for non-existing token", async function () {
      const { nft } = contracts;
      
      await expect(
        nft.getMerkleRoot(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Authorized Minter Management", function () {
    it("should set authorized minter by owner", async function () {
      const { admin, nft, institution1 } = contracts;

      await expect(
        nft.connect(admin).setAuthorizedMinter(await institution1.getAddress(), true)
      ).to.emit(nft, "AuthorizedMinterUpdated");

      expect(await nft.isAuthorizedMinter(await institution1.getAddress())).to.be.true;
    });

    it("should remove authorized minter by owner", async function () {
      const { admin, nft, institution1 } = contracts;

      // First authorize
      await nft.connect(admin).setAuthorizedMinter(await institution1.getAddress(), true);
      expect(await nft.isAuthorizedMinter(await institution1.getAddress())).to.be.true;

      // Then remove authorization
      await nft.connect(admin).setAuthorizedMinter(await institution1.getAddress(), false);
      expect(await nft.isAuthorizedMinter(await institution1.getAddress())).to.be.false;
    });

    it("should fail to set authorized minter by non-owner", async function () {
      const { student1, nft, institution1 } = contracts;

      await expect(
        nft.connect(student1).setAuthorizedMinter(await institution1.getAddress(), true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Multiple Students and NFTs", function () {
    beforeEach(async function () {
      await TestSetup.setupAuthorizedMinters(
        contracts.nft,
        contracts.admin,
        contracts.institution1,
        contracts.institution2
      );
    });

    it("should mint NFTs for multiple students", async function () {
      const { admin, student1, student2, nft } = contracts;

      // Mint for student1
      await nft.connect(admin).mintAcademicSnapshot(
        await student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        MockData.MOCK_MERKLE_DATA.root1,
        [mockCredentials.diploma.id],
        await contracts.institution1.getAddress(),
        mockAcademicData.bachelor.level,
        mockAcademicData.bachelor.field,
        mockAcademicData.bachelor.graduationDate
      );

      // Mint for student2
      await nft.connect(admin).mintAcademicSnapshot(
        await student2.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.credentials.uri,
        MockData.MOCK_MERKLE_DATA.root2,
        [mockCredentials.certificate.id],
        await contracts.institution2.getAddress(),
        mockAcademicData.master.level,
        mockAcademicData.master.field,
        mockAcademicData.master.graduationDate
      );

      const student1NFT = await nft.getStudentLatestNFT(await student1.getAddress());
      const student2NFT = await nft.getStudentLatestNFT(await student2.getAddress());

      expect(student1NFT).to.equal(0);
      expect(student2NFT).to.equal(1);

      const totalSupply = await nft.totalSupply();
      expect(totalSupply).to.equal(2);
    });

    it("should mint multiple NFTs for same student", async function () {
      const { admin, student1, nft } = contracts;

      // Mint first NFT
      await nft.connect(admin).mintAcademicSnapshot(
        await student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        MockData.MOCK_MERKLE_DATA.root1,
        [mockCredentials.diploma.id],
        await contracts.institution1.getAddress(),
        mockAcademicData.bachelor.level,
        mockAcademicData.bachelor.field,
        mockAcademicData.bachelor.graduationDate
      );

      // Mint second NFT
      await nft.connect(admin).mintAcademicSnapshot(
        await student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.credentials.uri,
        MockData.MOCK_MERKLE_DATA.root2,
        [mockCredentials.certificate.id],
        await contracts.institution1.getAddress(),
        mockAcademicData.master.level,
        mockAcademicData.master.field,
        mockAcademicData.master.graduationDate
      );

      const studentNFTs = await nft.getStudentNFTs(await student1.getAddress());
      expect(studentNFTs.length).to.equal(2);

      const latestNFT = await nft.getStudentLatestNFT(await student1.getAddress());
      expect(latestNFT).to.equal(1); // Should be the second NFT
    });
  });

  describe("Different Academic Levels", function () {
    beforeEach(async function () {
      await TestSetup.setupAuthorizedMinters(
        contracts.nft,
        contracts.admin,
        contracts.institution1,
        contracts.institution2
      );
    });

    it("should mint Bachelor degree NFT", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.bachelor;

      await nft.connect(admin).mintAcademicSnapshot(
        await student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.metadata.uri,
        MockData.MOCK_MERKLE_DATA.root1,
        [mockCredentials.diploma.id],
        await contracts.institution1.getAddress(),
        academicData.level,
        academicData.field,
        academicData.graduationDate
      );

      const tokenId = await nft.getStudentLatestNFT(await student1.getAddress());
      const snapshot = await nft.getAcademicSnapshot(tokenId);

      expect(snapshot.academicLevel).to.equal("Bachelor");
      expect(snapshot.fieldOfStudy).to.equal("Computer Science");
    });

    it("should mint Master degree NFT", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.master;

      await nft.connect(admin).mintAcademicSnapshot(
        await student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.credentials.uri,
        MockData.MOCK_MERKLE_DATA.root2,
        [mockCredentials.certificate.id],
        await contracts.institution1.getAddress(),
        academicData.level,
        academicData.field,
        academicData.graduationDate
      );

      const tokenId = await nft.getStudentLatestNFT(await student1.getAddress());
      const snapshot = await nft.getAcademicSnapshot(tokenId);

      expect(snapshot.academicLevel).to.equal("Master");
      expect(snapshot.fieldOfStudy).to.equal("Data Science");
    });

    it("should mint Doctorate degree NFT", async function () {
      const { admin, student1, nft } = contracts;
      const academicData = mockAcademicData.doctorate;

      await nft.connect(admin).mintAcademicSnapshot(
        await student1.getAddress(),
        MockData.MOCK_ARWEAVE_DATA.transcript.uri,
        MockData.MOCK_MERKLE_DATA.root3,
        [mockCredentials.diploma.id, mockCredentials.transcript.id],
        await contracts.institution1.getAddress(),
        academicData.level,
        academicData.field,
        academicData.graduationDate
      );

      const tokenId = await nft.getStudentLatestNFT(await student1.getAddress());
      const snapshot = await nft.getAcademicSnapshot(tokenId);

      expect(snapshot.academicLevel).to.equal("Doctorate");
      expect(snapshot.fieldOfStudy).to.equal("Artificial Intelligence");
    });
  });
});
