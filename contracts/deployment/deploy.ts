/**
 * @title PhilBlocks Simple Deployment Script
 * @dev Single deployment script for Hardhat and Flow EVM Testnet
 */

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';

export default async function deploy(hre: HardhatRuntimeEnvironment) {
  console.log('🚀 Starting PhilBlocks deployment...');
  
  try {
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Deploy MockVerifier
    console.log('🔐 Deploying MockVerifier...');
    const MockVerifier = await hre.ethers.getContractFactory('MockVerifier');
    const verifier = await MockVerifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log(`✅ MockVerifier: ${verifierAddress}`);

    // Deploy PhilBlocksUID (implementation) and ERC1967Proxy with initializer
    console.log('🆔 Deploying PhilBlocksUID (implementation)...');
    const PhilBlocksUID = await hre.ethers.getContractFactory('PhilBlocksUID');
    const uidImpl = await PhilBlocksUID.deploy();
    await uidImpl.waitForDeployment();
    const uidImplAddress = await uidImpl.getAddress();
    console.log(`✅ PhilBlocksUID Implementation: ${uidImplAddress}`);

    console.log('🧩 Deploying ERC1967Proxy for PhilBlocksUID with initializer...');
    const ERC1967Proxy = await hre.ethers.getContractFactory('ERC1967Proxy');
    const initData = PhilBlocksUID.interface.encodeFunctionData('initialize', [verifierAddress, deployer.address]);
    const uidProxy = await ERC1967Proxy.deploy(uidImplAddress, initData);
    await uidProxy.waitForDeployment();
    const uidAddress = await uidProxy.getAddress();
    console.log(`✅ PhilBlocksUID (Proxy): ${uidAddress}`);
    
    // Deploy AcademicJourneyNFT
    console.log('🎓 Deploying AcademicJourneyNFT...');
    const AcademicJourneyNFT = await hre.ethers.getContractFactory('AcademicJourneyNFT');
    const nft = await AcademicJourneyNFT.deploy('PhilBlocks Academic Journey', 'PBAJ', deployer.address);
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log(`✅ AcademicJourneyNFT: ${nftAddress}`);
    
    // Deploy PhilBlocksCore
    console.log('🏗️ Deploying PhilBlocksCore...');
    const PhilBlocksCore = await hre.ethers.getContractFactory('PhilBlocksCore');
    const core = await PhilBlocksCore.deploy(uidAddress, nftAddress, deployer.address);
    await core.waitForDeployment();
    const coreAddress = await core.getAddress();
    console.log(`✅ PhilBlocksCore: ${coreAddress}`);
    
    // Configure role managers directly instead of calling initializeAllContracts
    console.log('⚙️ Configuring role managers...');
    const uid = new hre.ethers.Contract(uidAddress, PhilBlocksUID.interface, deployer);
    await uid.setRoleManager(coreAddress);
    await nft.setRoleManager(coreAddress);
    console.log('✅ Role managers configured');
    
    // Set up additional authorizations using centralized management
    console.log('🔐 Setting up additional authorizations...');
    await core.grantInstitutionRoleAcrossAllContracts(deployer.address);
    console.log('✅ Additional authorizations set across all contracts');
    
    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      contracts: {
        mockVerifier: verifierAddress,
        uid: uidAddress,
        academicNFT: nftAddress,
        core: coreAddress,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Save to file
    const fs = require('fs');
    const deploymentsDir = `deployments/${hre.network.name}`;
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    fs.writeFileSync(
      `${deploymentsDir}/deployment-info.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    // Print summary
    console.log('\n📋 Deployment Summary:');
    console.log('='.repeat(50));
    console.log(`🌐 Network: ${deploymentInfo.network}`);
    console.log(`⛓️ Chain ID: ${deploymentInfo.chainId}`);
    console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
    console.log('\n📄 Contracts:');
    console.log(`  MockVerifier: ${verifierAddress}`);
    console.log(`  PhilBlocksUID: ${uidAddress}`);
    console.log(`  AcademicJourneyNFT: ${nftAddress}`);
    console.log(`  PhilBlocksCore: ${coreAddress}`);
    
    // Show explorer links for Flow EVM Testnet
    if (network.chainId === 545n) {
      console.log('\n🔗 Explorer Links:');
      console.log(`  MockVerifier: https://evm-testnet.flowscan.io/address/${verifierAddress}`);
      console.log(`  PhilBlocksUID: https://evm-testnet.flowscan.io/address/${uidAddress}`);
      console.log(`  AcademicJourneyNFT: https://evm-testnet.flowscan.io/address/${nftAddress}`);
      console.log(`  PhilBlocksCore: https://evm-testnet.flowscan.io/address/${coreAddress}`);
    }
    
    console.log('='.repeat(50));
    console.log('🎉 Deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Execute when invoked via `hardhat run`
import hre from 'hardhat';

deploy(hre)
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });