import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

 
const THIRDWEB_API_KEY = process.env.THIRDWEB_API_KEY ?? ""
const PHILBLOCKS_UUID = process.env.PHILBLOCKS_UUID_CONTRACT ?? ""
const PHILBLOCKS_CORE = process.env.PHILBLOCKS_CORE_CONTRACT ?? ""

const client = createThirdwebClient({
  clientId: THIRDWEB_API_KEY,
});

export const philblocksUuidContract= getContract({
  client,
  chain: defineChain(545),
  address: PHILBLOCKS_UUID,
});


export const philblocksCoreContract= getContract({
  client,
  chain: defineChain(545),
  address: PHILBLOCKS_CORE,
});


