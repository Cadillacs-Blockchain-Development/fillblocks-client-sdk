import { ethers } from "ethers";
import organizationModel from "../models/organization.model";

export const generateWallet = async () => {
  let wallet;
  let isNotExist = true;

  while (isNotExist) {
    wallet = ethers.Wallet.createRandom() ; 
    const address = wallet.address;

    const findOrg = await organizationModel.findOne({ wallet: address });
    if (!findOrg) {
      isNotExist = false;  
    }
  }

  return {
    address: (wallet as any).address,
    privateKey: (wallet as any).privateKey,
  };
};


