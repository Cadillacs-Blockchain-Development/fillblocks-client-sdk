import organizationModel from "../models/organization.model";

interface ClientCredentials {
  client: string;
  secretKey: string;
}

export const generateClientSecret = async (): Promise<ClientCredentials> => {
  const str =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

  const generateRandomString = (length: number): string => {
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * str.length);
      result += str.charAt(randomIndex);
    }
    return result;
  };

  let client = "";
  let secretKey = "";
  let isUnique = false;

  while (!isUnique) {
    client = generateRandomString(36);
    secretKey = generateRandomString(64);

    const existing = await organizationModel.findOne({ client, secretKey });

    if (!existing) {
      isUnique = true;
    }
  }

  console.log(client, secretKey);

  return {
    client,
    secretKey,
  };
};
