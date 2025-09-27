import { prepareContractCall, sendTransaction } from "thirdweb";
import { ethers } from "ethers";
import { setupServerWallet } from "./server.wallet";
import {  philblocksUuidContract, philblocksCoreContract} from "./contract";
import { UuidModel } from "../models/studentUid";
 

export const generateUuid = async (
  uuid: string,
  institutionId: string
): Promise<any> => {
  try {
    if (!uuid || !institutionId) {
      throw new Error("uuid and institutionId are required");
    }

    const uidHash: any = ethers.keccak256(ethers.toUtf8Bytes(uuid));
    const institutionHash: any = ethers.keccak256(ethers.toUtf8Bytes(institutionId));

    const aBigInt: [bigint, bigint] = [0n, 0n];
    const bBigInt: [[bigint, bigint], [bigint, bigint]] = [
      [0n, 0n],
      [0n, 0n],
    ];
    const cBigInt: [bigint, bigint] = [0n, 0n];
    const inputBigInt: [bigint, bigint] = [0n, 0n];

    const wallet = await setupServerWallet();
    if (!wallet) throw new Error("Failed to initialize server wallet");

    const transaction = await prepareContractCall({
      contract: philblocksUuidContract,
      method:
        "function registerUID(bytes32 uidHash, bytes32 institutionHash, uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[2] input)",
      params: [uidHash, institutionHash, aBigInt, bBigInt, cBigInt, inputBigInt],
    });

    const txResponse = await sendTransaction({
      transaction,
      account: wallet as any,
    });

    console.log("✅ UUID transaction sent:", (txResponse as any).hash);


    const PHILBLOCKS_UUID_ABI = [
      "event UIDRegistered(bytes32 indexed uidHash, address indexed user, uint256 timestamp)"
    ];
    const iface = new ethers.Interface(PHILBLOCKS_UUID_ABI);

    const receipt = await wallet.provider?.waitForTransaction((txResponse as any).hash);

    const decodedEvents: any[] = [];
    if (receipt && receipt.logs) {
      receipt.logs.forEach((log:any) => {
        try {
          const parsed :any= iface.parseLog(log);
          decodedEvents.push({
            name: parsed.name,
            uidHash: parsed.args.uidHash,
            user: parsed.args.user,
            timestamp: parsed.args.timestamp.toString()
          });
        } catch {}
      });
    }
 
console.log({logs:decodedEvents[0]})
    return {txResponse:(txResponse as any).hash ,logs:decodedEvents[0]};
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
    console.log("Initializing student data stream:", studentUID, initialArweaveTxId);

    const transaction = await prepareContractCall({
      contract: philblocksCoreContract,
      method: "function initializeStudentDataStream(bytes32 studentUID, string initialArweaveTxId)",
      params: [studentUID as any, initialArweaveTxId],
    });

    const wallet = await setupServerWallet();
    if (!wallet) {
      throw new Error("Failed to initialize server wallet");
    }

    const txResponse = await sendTransaction({
      transaction,
      account: wallet as any,
    });

    console.log("✅ Student data stream initialized, txHash:", (txResponse as any).hash);
    return (txResponse as any).hash;
  } catch (error: any) {
    console.error("❌ Error in initializeStudentDataStream:", error?.message || error);
    throw new Error("Failed to initialize student data stream");
  }
};



export const updateUserDataOnBlockchain = async (
  userId: string,
  dataType: string,
  currentArwavesTxId: string
) => {
  try {
    const studentInfo: any = await UuidModel.findOne({ userId: userId });
    const wallet = await setupServerWallet();
    if (!wallet) {
      throw new Error("Failed to initialize server wallet");
    }

   
    function toBytes32(data:any) {
      // Convert string to bytes and hash it (keccak256 returns 32 bytes)
      return ethers.keccak256(ethers.toUtf8Bytes(data));
    }

    const previousDataHash = toBytes32(studentInfo.previousDataHash);
    const currentDataHash = toBytes32(currentArwavesTxId);

    const transaction = await prepareContractCall({
      contract: philblocksCoreContract,
      method:
        "function updateStudentData(bytes32 studentUID, string dataType, string arweaveTxId, bytes32 previousDataHash, bytes32 currentDataHash)",
      params: [
        (studentInfo.Uid as any),
        dataType,
        currentArwavesTxId,
        (previousDataHash as any),
       ( currentDataHash as any),
      ],
    });

    const updatePreviousDataHash = await UuidModel.findByIdAndUpdate(studentInfo._id, { previousDataHash: currentArwavesTxId });

    const transactionHash = await sendTransaction({
      transaction,
      account: wallet as any,
    });

    return (transactionHash as any)?.hash;
  } catch (error) {
    console.error("Error in updateUserData:", error);
    throw error;
  }
};
