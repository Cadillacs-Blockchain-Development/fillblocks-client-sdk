import { ethers } from "ethers";

export const setupServerWallet = async (): Promise<ethers.Wallet> => {
  if (!process.env.WALLET_PRIVATE_KEY || !process.env.THIRDWEB_API_KEY) {
    throw new Error("Missing WALLET_PRIVATE_KEY or THIRDWEB_API_KEY in env");
  }

  const rpcUrl = `https://545.rpc.thirdweb.com/${process.env.THIRDWEB_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

  const balanceWei = await provider.getBalance(wallet.address);
  console.log("Wallet address:", wallet.address, "Balance (ETH):", ethers.formatEther(balanceWei));

  return wallet;
};
