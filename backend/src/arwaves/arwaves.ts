import Arweave from "arweave";

export async function arweaveSetup() {
  const arweave = Arweave.init({
    host: "localhost",
    port: 1984,
    protocol: "http",
  });

  const wallet = await arweave.wallets.generate();
  const address = await arweave.wallets.jwkToAddress(wallet);
  console.log("🔑 Test wallet address:", address);

  await arweave.api.get(`/mint/${address}/1000000000000`); // 1000 AR
  console.log("💰 Wallet funded with 1000 AR (testnet only)");

  const balance = await arweave.wallets.getBalance(address);
  console.log("🏦 Balance (AR):", arweave.ar.winstonToAr(balance));

return {arweave,wallet,address}
}

