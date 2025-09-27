/**
 * @title PhilBlocks Contract Verification Script
 * @dev Simple verification script for Flow EVM Testnet
 */

import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function verify(hre: HardhatRuntimeEnvironment) {
  console.log('🔍 Starting contract verification...');
  
  try {
    const network = await (hre as any).ethers.provider.getNetwork();
    
    // Only verify on Flow EVM Testnet
    if (network.chainId !== 545n) {
      console.log('⚠️ Verification only supported on Flow EVM Testnet');
      return;
    }
    
    // Load deployment info
    const fs = require('fs');
    const deploymentFile = `deployments/${(hre as any).network.name}/deployment-info.json`;
    
    if (!fs.existsSync(deploymentFile)) {
      console.error('❌ No deployment info found. Please deploy contracts first.');
      return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const deployer = deploymentInfo.deployer as string;

    const mockVerifier = deploymentInfo.contracts?.mockVerifier as string | undefined;
    const uidProxy = deploymentInfo.contracts?.uid as string | undefined;
    const uidImplementation = deploymentInfo.contracts?.uidImplementation || process.env['UID_IMPLEMENTATION_ADDRESS'];
    const nft = deploymentInfo.contracts?.academicNFT as string | undefined;
    const core = deploymentInfo.contracts?.core as string | undefined;

    // Helper to run verification with retries
    async function verifyWithArgs(name: string, address: string, constructorArguments: any[], fullyQualified?: string) {
      try {
        console.log(`🔍 Verifying ${name} at ${address}...`);
        const params: any = { address, constructorArguments };
        if (fullyQualified) params.contract = fullyQualified; // e.g. contracts/PhilBlocksUID.sol:PhilBlocksUID
        await (hre as any).run('verify:verify', params);
        console.log(`✅ ${name} verified`);
      } catch (error) {
        console.log(`⚠️ ${name} verification failed: ${error}`);
      }
      // Rate limit spacing
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 1) MockVerifier (no constructor args)
    if (mockVerifier) {
      await verifyWithArgs('MockVerifier', mockVerifier, [], 'contracts/mocks/MockVerifier.sol:MockVerifier');
    }

    // 2) PhilBlocksUID implementation (verify implementation, not proxy)
    if (uidImplementation) {
      await verifyWithArgs('PhilBlocksUID (Implementation)', uidImplementation, [], 'contracts/PhilBlocksUID.sol:PhilBlocksUID');
    } else {
      console.log('ℹ️ Skipping PhilBlocksUID implementation verification (address not available). Set UID_IMPLEMENTATION_ADDRESS env or include in deployment info.');
    }

    // 3) AcademicJourneyNFT (constructor: name, symbol, admin)
    if (nft) {
      await verifyWithArgs('AcademicJourneyNFT', nft, ['PhilBlocks Academic Journey', 'PBAJ', deployer], 'contracts/AcademicJourneyNFT.sol:AcademicJourneyNFT');
    }

    // 4) PhilBlocksCore (constructor: uidProxy, nft, admin)
    if (core && uidProxy && nft) {
      await verifyWithArgs('PhilBlocksCore', core, [uidProxy, nft, deployer], 'contracts/PhilBlocksCore.sol:PhilBlocksCore');
    }

    console.log('🎉 Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}