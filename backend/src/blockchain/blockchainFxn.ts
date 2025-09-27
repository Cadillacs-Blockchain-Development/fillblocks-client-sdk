import { prepareContractCall, sendTransaction } from "thirdweb";
import { ethers } from "ethers";
import { setupServerWallet } from "./server.wallet";
import {  philblocksUuidContract, philblocksCoreContract} from "./contract";

export const generateUuid = async (
  uuid: string,
  institutionId: string
): Promise<string> => {
  try {
    const uidHash = ethers.keccak256(ethers.toUtf8Bytes(uuid));
    const institutionHash = ethers.keccak256(ethers.toUtf8Bytes(institutionId));

    const a = ["0", "0"];
    const b = [
      ["0", "0"],
      ["0", "0"],
    ];
    const c = ["0", "0"];
    const input = ["0", "0"];

    const aBigInt: [bigint, bigint] = [BigInt(a[0]), BigInt(a[1])];
    const bBigInt: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(b[0][0]), BigInt(b[0][1])],
      [BigInt(b[1][0]), BigInt(b[1][1])],
    ];
    const cBigInt: [bigint, bigint] = [BigInt(c[0]), BigInt(c[1])];
    const inputBigInt: [bigint, bigint] = [BigInt(input[0]), BigInt(input[1])];

    const wallet = await setupServerWallet(); // await if async
    if (!wallet) {
      throw new Error("Failed to initialize server wallet");
    }

    const transaction = await prepareContractCall({
      contract: philblocksUuidContract,
      method:
        "function registerUID(bytes32 uidHash, bytes32 institutionHash, uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[2] input)",
      params: [uidHash as any, institutionHash as any, aBigInt, bBigInt, cBigInt, inputBigInt],
    });

    const transactionResponse = await sendTransaction({
      transaction,
      account: wallet as any,
    });

    return (transactionResponse as any)?.hash;
  } catch (error: any) {
    console.error("❌ Error in generateUuid:", error?.message || error);
    throw new Error("Failed to generate UUID on-chain");
  }
};


export const initializeStudentDataStream = async (
  studentUID: string,
  initialArweaveTxId: string
): Promise<string> => {
  try {
    const transaction = await prepareContractCall({
      contract: philblocksCoreContract,
      method:
        "function initializeStudentDataStream(bytes32 studentUID, string initialArweaveTxId)",
      params: [(studentUID) as any, initialArweaveTxId],
    });

   const wallet = setupServerWallet();
    if (!wallet) {
      throw new Error("Failed to initialize server wallet");
    }
    const txResponse = await sendTransaction({
      transaction,
      account:(wallet as any) ,
    });

    return (txResponse as any).hash;
  } catch (error: any) {
    console.error("❌ Error in initializeStudentDataStream:", error?.message || error);
    throw new Error("Failed to initialize student data stream");
  }
};
