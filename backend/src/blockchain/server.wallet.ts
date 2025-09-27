import { ethers } from "ethers";

export const setupServerWallet = async (): Promise<{ wallet: ethers.Wallet; balance: string }> => {
  const rpcUrl = `https://545.rpc.thirdweb.com/${process.env.THIRDWEB_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);

  const balanceWei = await provider.getBalance(wallet.address);
  const balance = ethers.formatEther(balanceWei);
  console.log(balanceWei,balance)
  
  return { wallet, balance };
};
