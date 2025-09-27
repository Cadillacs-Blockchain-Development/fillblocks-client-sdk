# PhilBlocks Architecture

A comprehensive blockchain-powered education management platform leveraging smart contracts for decentralized credential management and verification.

## Purpose

This project is specifically developed by **Cadillacs** to support **PhilBlocks** (philblocks.com) - an innovative education management platform that combines traditional academic systems with blockchain technology for secure, verifiable credential management.

**Current Status**: Active development for PhilBlocks. Simplified architecture with mock ZK proofs for development and testing.

## Architecture

PhilBlocks operates on a simplified, clean architecture:

- **Smart Contracts**: Deployed on Hardhat local network and Flow EVM Testnet
- **Storage Layer**: Arweave for permanent credential storage
- **SDK Layer**: TypeScript SDK with mock ZK proof generation
- **Examples**: Working examples for all major functionalities

## Features

### Core Functionality
- **Smart Contract Integration**: PhilBlocksUID, AcademicJourneyNFT, and PhilBlocksCore contracts
- **Mock ZK Proof Generation**: Development-ready zero-knowledge proof system
- **Academic Journey NFTs**: Immutable credential snapshots (ERC721)
- **UID Management**: Unique identifier generation and recovery system
- **Dynamic Data Streaming**: Continuous student data updates
- **Simplified Architecture**: Clean, maintainable codebase

### Blockchain Features
- **Merkle Root Anchoring**: Data integrity verification
- **Academic Journey NFTs**: Immutable credential snapshots (ERC721)
- **Mock Zero-Knowledge Proofs**: Privacy-preserving national ID verification (development mode)
- **UID Management**: Unique identifier generation and recovery system
- **Centralized Access Control**: Role-based permissions managed by PhilBlocksCore
- **Dynamic Data Streaming**: Continuous student data updates

### Data Flow
1. **Student Registration**: UID creation with mock ZK proof verification
2. **Dynamic Updates**: Continuous student data streaming (attendance, grades, etc.)
3. **Credential Storage**: Permanent backup to Arweave
4. **Data Integrity**: Student-specific merkle roots anchored on blockchain
5. **Verification**: Trustless credential verification via blockchain
6. **NFT Generation**: Academic journey snapshots as immutable NFTs

## Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- Basic blockchain understanding

## Installation

```bash
git clone <repository-url>
cd PhilBlocks-Architecture
npm install
```

## Configuration

Copy the environment template and configure:

```bash
cp env.example .env
```

Edit `.env` file:
```bash
# Private key for contract deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Flow EVM Testnet RPC URL
FLOW_EVM_TESTNET_RPC_URL=https://testnet.evm.nodes.onflow.org

# CoinMarketCap API key for gas reporting (optional)
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Enable gas reporting
REPORT_GAS=true
```

## Deployment

### Local Development (Hardhat)

```bash
# Deploy to Hardhat local network
npm run deploy:hardhat
```

### Flow EVM Testnet

```bash
# Deploy to Flow EVM Testnet
npm run deploy:flow

# Verify contracts on Flowscan
npm run verify:flow
```

### Deployment Output

After successful deployment, you'll see:
- Contract addresses for all deployed contracts
- Transaction hashes for deployment transactions
- Explorer links for Flow EVM Testnet deployments
- Deployment info saved to `deployments/{network}/deployment-info.json`

## Usage

### SDK Integration

```typescript
import { PhilBlocksSDK } from './sdk/philblocksSDK';
import { ethers } from 'ethers';

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
const signer = new ethers.Wallet(privateKey, provider);

// Initialize SDK
const sdk = new PhilBlocksSDK({
  provider,
  signer,
  uidContractAddress: '0x...' // Deployed UID contract address
});

// Register a new learner
const result = await sdk.registerLearner({
  nationalID: '123456789',
  institutionId: 'university-001',
  recoveryMethod: 'email',
  recoveryData: 'student@example.com'
});

console.log('Registration successful:', result);
```

### Mock ZK Proof Generation

```typescript
import { ZKProofGenerator } from './sdk/zkProofGenerator';

const zkGenerator = new ZKProofGenerator();
await zkGenerator.initialize();

// Generate mock proof for national ID verification
const proof = await zkGenerator.generateProof({
  nationalID: '123456789',
  salt: 'random-salt',
  institutionId: 'university-001'
});

console.log('Mock ZK Proof generated:', proof);
```

## Examples

### Registration Example
```bash
npx ts-node examples/registration-example.ts
```

### NFT Minting Example
```bash
npx ts-node examples/nft-minting-example.ts
```

### Dynamic Data Streaming Example
```bash
npx ts-node examples/dynamic-data-streaming-example.ts
```

### Recovery Example
```bash
npx ts-node examples/recovery-example.ts
```

## Testing

### Run Comprehensive E2E Tests
```bash
npm run test:contracts
```

### Test Coverage
- **PhilBlocksCore**: Role management, data streaming, merkle anchoring
- **AcademicJourneyNFT**: NFT minting, verification, credential management
- **PhilBlocksUID**: UID registration, recovery, institution management
- **Full System Integration**: Complete student journey from registration to graduation

## Development

### Project Structure
```
PhilBlocks-Architecture/
├── contracts/           # Smart contracts
│   ├── PhilBlocksUID.sol
│   ├── AcademicJourneyNFT.sol
│   ├── PhilBlocksCore.sol
│   └── mocks/MockVerifier.sol
├── deployment/          # Deployment scripts
│   ├── deploy.ts        # Main deployment script
│   └── verify.ts        # Contract verification
├── sdk/                # TypeScript SDK
│   ├── philblocksSDK.ts
│   ├── uidManager.ts
│   ├── zkProofGenerator.ts
│   └── mfaManager.ts
├── examples/           # Usage examples
├── test/              # Comprehensive E2E tests
└── docs/              # Documentation
```

### Smart Contracts
- **PhilBlocksUID.sol**: UID management with mock ZK proofs
- **AcademicJourneyNFT.sol**: ERC721 NFTs for academic credentials
- **PhilBlocksCore.sol**: Main integration contract with centralized access control
- **MockVerifier.sol**: Mock verifier for development and testing

### SDK Components
- **PhilBlocksSDK**: Main SDK interface
- **UIDManager**: Unique identifier management
- **ZKProofGenerator**: Mock zero-knowledge proof generation
- **MFAManager**: Multi-factor authentication

## Available Networks

- **Hardhat Local**: Chain ID 1337 (for development)
- **Flow EVM Testnet**: Chain ID 545 (for testing)

## Performance

The platform is optimized for:
- **Fast Deployment**: Simple, single-file deployment scripts
- **Mock ZK Proofs**: Instant proof generation for development
- **Clean Architecture**: Maintainable and extensible codebase
- **Comprehensive Testing**: Full E2E test coverage

## Contributing

This project is specifically developed for PhilBlocks. For contributions:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Ensure all tests pass

## License

MIT License - see LICENSE file for details.

## Credits

- **Author**: [Cadillacs](https://cadillacs.in)
- **Primary Use Case**: [PhilBlocks](https://philblocks.com)
- **Storage Layer**: [Arweave](https://arweave.org)
- **Blockchain Layer**: [Flow EVM Testnet](https://docs.onflow.org/evm/)

## Links

- **PhilBlocks Platform**: https://philblocks.com
- **Cadillacs**: https://cadillacs.in
- **Flow EVM Documentation**: https://docs.onflow.org/evm/
- **Flow Testnet Explorer**: https://evm-testnet.flowscan.io

---

*This project is developed specifically for PhilBlocks with a simplified architecture focused on development and testing. Mock ZK proofs are used for development - real ZK proofs can be implemented when needed.*