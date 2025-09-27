import { ethers } from "hardhat";

/**
 * @title MockData
 * @dev Helper class for generating mock data for comprehensive testing
 */
export class MockData {
  // Mock user data
  static readonly MOCK_USERS = {
    student1: {
      address: "0x1234567890123456789012345678901234567890",
      nationalID: "1234567890",
      salt: "salt123",
      institutionId: "university-ph"
    },
    student2: {
      address: "0x2345678901234567890123456789012345678901",
      nationalID: "2345678901",
      salt: "salt456",
      institutionId: "college-ph"
    },
    student3: {
      address: "0x3456789012345678901234567890123456789012",
      nationalID: "3456789012",
      salt: "salt789",
      institutionId: "university-ph"
    }
  };

  // Mock institution data
  static readonly MOCK_INSTITUTIONS = {
    university: {
      address: "0x4567890123456789012345678901234567890123",
      name: "Philippine University",
      type: "university",
      authorized: true
    },
    college: {
      address: "0x5678901234567890123456789012345678901234",
      name: "Manila College",
      type: "college",
      authorized: true
    },
    unauthorized: {
      address: "0x6789012345678901234567890123456789012345",
      name: "Unauthorized Institution",
      type: "college",
      authorized: false
    }
  };

  // Mock admin data
  static readonly MOCK_ADMINS = {
    primary: {
      address: "0x7890123456789012345678901234567890123456",
      role: "ADMIN_ROLE"
    },
    secondary: {
      address: "0x8901234567890123456789012345678901234567",
      role: "ADMIN_ROLE"
    }
  };

  // Mock updater data
  static readonly MOCK_UPDATERS = {
    registrar: {
      address: "0x9012345678901234567890123456789012345678",
      role: "UPDATER_ROLE",
      institution: "university"
    },
    records: {
      address: "0x0123456789012345678901234567890123456789",
      role: "UPDATER_ROLE",
      institution: "college"
    }
  };

  // Mock academic data
  static readonly MOCK_ACADEMIC_DATA = {
    bachelor: {
      level: "Bachelor",
      field: "Computer Science",
      graduationDate: 1704067200, // 2024-01-01
      gpa: "3.8",
      credits: 120
    },
    master: {
      level: "Master",
      field: "Data Science",
      graduationDate: 1735689600, // 2025-01-01
      gpa: "3.9",
      credits: 36
    },
    doctorate: {
      level: "Doctorate",
      field: "Artificial Intelligence",
      graduationDate: 1767225600, // 2026-01-01
      gpa: "4.0",
      credits: 60
    }
  };

  // Mock credential data
  static readonly MOCK_CREDENTIALS = {
    diploma: {
      id: "DIPLOMA_CS_2024_001",
      type: "diploma",
      issuer: "university",
      issueDate: 1704067200,
      validUntil: 0
    },
    transcript: {
      id: "TRANSCRIPT_CS_2024_001",
      type: "transcript",
      issuer: "university",
      issueDate: 1704067200,
      validUntil: 0
    },
    certificate: {
      id: "CERT_DATA_SCIENCE_2024_001",
      type: "certificate",
      issuer: "college",
      issueDate: 1704067200,
      validUntil: 1735689600
    }
  };

  // Mock Arweave data
  static readonly MOCK_ARWEAVE_DATA = {
    metadata: {
      uri: "https://arweave.net/metadata123",
      txId: "metadata123",
      contentType: "application/json"
    },
    credentials: {
      uri: "https://arweave.net/credentials456",
      txId: "credentials456",
      contentType: "application/json"
    },
    transcript: {
      uri: "https://arweave.net/transcript789",
      txId: "transcript789",
      contentType: "application/pdf"
    }
  };

  // Mock recovery data
  static readonly MOCK_RECOVERY_DATA = {
    email: {
      method: "email",
      data: "student@university.edu.ph",
      hash: ethers.keccak256(ethers.toUtf8Bytes("student@university.edu.ph"))
    },
    phone: {
      method: "phone",
      data: "+639123456789",
      hash: ethers.keccak256(ethers.toUtf8Bytes("+639123456789"))
    },
    biometric: {
      method: "biometric",
      data: "biometric_hash_123",
      hash: ethers.keccak256(ethers.toUtf8Bytes("biometric_hash_123"))
    }
  };

  // Mock merkle data
  static readonly MOCK_MERKLE_DATA = {
    root1: ethers.keccak256(ethers.toUtf8Bytes("merkle_root_1")),
    root2: ethers.keccak256(ethers.toUtf8Bytes("merkle_root_2")),
    root3: ethers.keccak256(ethers.toUtf8Bytes("merkle_root_3")),
    leaf1: ethers.keccak256(ethers.toUtf8Bytes("leaf_1")),
    leaf2: ethers.keccak256(ethers.toUtf8Bytes("leaf_2")),
    leaf3: ethers.keccak256(ethers.toUtf8Bytes("leaf_3"))
  };

  // Mock student data stream data
  static readonly MOCK_STREAM_DATA = {
    grades: {
      type: "GRADES",
      data: {
        semester: "2024-1",
        courses: [
          { code: "CS101", name: "Programming", grade: "A", credits: 3 },
          { code: "CS102", name: "Data Structures", grade: "A-", credits: 3 },
          { code: "MATH101", name: "Calculus", grade: "B+", credits: 4 }
        ],
        gpa: 3.7
      }
    },
    attendance: {
      type: "ATTENDANCE",
      data: {
        semester: "2024-1",
        totalClasses: 30,
        attended: 28,
        percentage: 93.33
      }
    },
    assignments: {
      type: "ASSIGNMENTS",
      data: {
        semester: "2024-1",
        submitted: 15,
        total: 15,
        averageScore: 92.5
      }
    }
  };

  // Helper methods
  static generateUIDHash(nationalID: string, salt: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(nationalID + salt));
  }

  static generateInstitutionHash(institutionId: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(institutionId));
  }

  static generateMockProof(uidHash: string, institutionHash: string) {
    return {
      a: [0, 0],
      b: [[0, 0], [0, 0]],
      c: [0, 0],
      input: [uidHash, institutionHash]
    };
  }

  static generateMockRecoveryProof(nationalIDHash: string, saltHash: string, recoveryHash: string, methodHash: string) {
    return {
      a: [0, 0],
      b: [[0, 0], [0, 0]],
      c: [0, 0],
      input: [nationalIDHash, saltHash, recoveryHash, methodHash]
    };
  }

  static generateCredentialIds(count: number): string[] {
    const credentials = [];
    for (let i = 1; i <= count; i++) {
      credentials.push(`CRED_${i.toString().padStart(3, '0')}`);
    }
    return credentials;
  }

  static generateArweaveTxId(prefix: string = "tx"): string {
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${random}`;
  }

  static generateMockStudentProfile(uidHash: string, wallet: string) {
    return {
      uidHash,
      currentWallet: wallet,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      lastUpdated: Math.floor(Date.now() / 1000)
    };
  }
}
