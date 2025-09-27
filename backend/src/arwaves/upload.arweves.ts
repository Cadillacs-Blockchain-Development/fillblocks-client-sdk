import { arweaveSetup } from "./arwaves";

export const uploadToArweave = async (
  schema: string,
  data: any,
  OrganizationId: string,
) => {
  const { arwaves, wallet }: any = await arweaveSetup();

  const transaction = await arwaves.createTransaction(
    { data: JSON.stringify({ schema, ...data }) },
    wallet
  );

  transaction.addTag("App-Name", "Philblocks-sdk");
  transaction.addTag("Schema", schema);
  transaction.addTag("Content-Type", "application/json");
  transaction.addTag("OrganizationId", OrganizationId);

  await arwaves.transactions.sign(transaction, wallet);
  const response = await arwaves.transactions.post(transaction);

  return { transaction, response };
};
