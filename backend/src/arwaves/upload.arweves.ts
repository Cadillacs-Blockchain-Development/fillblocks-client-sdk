import { arweaveSetup } from "./arwaves";

export const uploadToArweave = async (
  schema: string,
  data: any,
  OrganizationId: string,
) => {
  const { arweave, wallet }: any = await arweaveSetup(); // ✅ FIXED

  const transaction = await arweave.createTransaction(
    { data: JSON.stringify({ schema, ...data }) },
    wallet
  );

  transaction.addTag("App-Name", "Philblocks-sdk");
  transaction.addTag("Schema", schema);
  transaction.addTag("Content-Type", "application/json");
  transaction.addTag("OrganizationId", OrganizationId);

  await arweave.transactions.sign(transaction, wallet);

  const response = await arweave.transactions.post(transaction);

  console.log("📤 Tx ID:", transaction.id);
  console.log("🌐 Status:", response.status);

  return { transactionId: transaction.id, response };
};
