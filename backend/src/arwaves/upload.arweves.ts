import { arweaveSetup } from "./arwaves";

export const uploadToArweave = async (
  schema: string,
  data: any,
  OrganizationId: string
) => {
  const { arweave, wallet }: any = await arweaveSetup();
  console.log("Uploading to Arweave - Schema:", schema, "OrgId:", OrganizationId, "Data:", data);
  
  const transaction = await arweave.createTransaction(
    { data: JSON.stringify({ schema, ...data }) },
    wallet
  );

  transaction.addTag("App-Name", "Philblocks-sdk");
  transaction.addTag("Schema", schema);
  transaction.addTag("Content-Type", "application/json");
  transaction.addTag("OrganizationId", OrganizationId);
  
  console.log("Transaction tags added:", {
    "App-Name": "Philblocks-sdk",
    "Schema": schema,
    "Content-Type": "application/json",
    "OrganizationId": OrganizationId
  });

  await arweave.transactions.sign(transaction, wallet);
  await arweave.transactions.post(transaction);

  try {
    await arweave.api.get("mine");
  } catch {}

  let status: number | null = null;
  let attempts = 0;

  while (status !== 200 && attempts < 20) {
    const txStatus = await arweave.transactions.getStatus(transaction.id);
    status = txStatus.status;
    if (status !== 200) await new Promise(res => setTimeout(res, 500));
    attempts++;
  }

  console.log("🌐 Transaction confirmed with status:", status, transaction.id);
  return { transactionId: transaction.id, status };
};
