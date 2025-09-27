import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const THIRDWEB_API_KEY = process.env.THIRDWEB_API_KEY;
const PHILBLOCKS_UUID = process.env.PHILBLOCKS_UUID_CONTRACT;
const PHILBLOCKS_CORE = process.env.PHILBLOCKS_CORE_CONTRACT;

if (!THIRDWEB_API_KEY) throw new Error("Missing THIRDWEB_API_KEY in env");
if (!PHILBLOCKS_UUID) throw new Error("Missing PHILBLOCKS_UUID_CONTRACT in env");
if (!PHILBLOCKS_CORE) throw new Error("Missing PHILBLOCKS_CORE_CONTRACT in env");

// Create Thirdweb client
const client = createThirdwebClient({
  clientId: THIRDWEB_API_KEY,
});

// Contract instances
export const philblocksUuidContract = getContract({
  client,
  chain: defineChain(545),
  address: PHILBLOCKS_UUID,
});

export const philblocksCoreContract = getContract({
  client,
  chain: defineChain(545),
  address: PHILBLOCKS_CORE,
});
