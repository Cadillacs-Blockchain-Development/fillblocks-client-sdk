import Arweave from "arweave";
import fs from "fs";
import path from "path";

const walletPath = path.join(__dirname, "../wallet.json");

export async function arweaveSetup() {
  const arweave = Arweave.init({
    host: "localhost",
    port: 1984,
    protocol: "http",
  });

  let wallet: any;

  if (fs.existsSync(walletPath)) {
    wallet = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    console.log("🔑 Loaded existing wallet from disk");
  } else {
    wallet = await arweave.wallets.generate();
    fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
    console.log("✨ New wallet generated and saved to wallet.json");
  }

  const address = await arweave.wallets.jwkToAddress(wallet);
  console.log("🔑 Wallet address:", address);

  await arweave.api.get(`/mint/${address}/1000000000000`);
  console.log("💰 Wallet funded with 1000 AR (testnet only)");

  const balance = await arweave.wallets.getBalance(address);
  console.log("🏦 Balance (AR):", arweave.ar.winstonToAr(balance));

  return { arweave, wallet, address };
}
