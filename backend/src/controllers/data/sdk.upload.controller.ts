import { Request, Response } from "express";
import { uploadToArweave } from "../../arwaves/upload.arweves";
import { generateUuid,initializeStudentDataStream, updateUserDataOnBlockchain } from "../../blockchain/blockchainFxn"; 
import { UuidModel } from "../../models/studentUid";


export const uploadData = async (req: Request, res: Response): Promise<any> => {
  try {
    const schema = req.params.schema ;
    const data = req.body.payload;
    const orgClientId = (req as any).organization?._id;

    console.log(data,"data")
    
    console.log("Upload request - Schema:", schema, "OrgId:", orgClientId, "Data:", data);
    
    if (!data) {
      return res.status(400).json({ message: "Missing required fields in payload" });
    }

    const { transactionId } = await uploadToArweave(schema, data, orgClientId?.toString());
    console.log("Transaction uploaded successfully:", transactionId);

    const {logs} = await generateUuid(data._id, data.current_school);

    const uid = await UuidModel.create({
      Uid:logs.uidHash,
      userId: data?._id,
      previousDataHash: transactionId
    })
    await initializeStudentDataStream(logs.uidHash, transactionId);
    
    return res
      .status(201)
      .json({ message: "Data uploaded successfully", data });
  } catch (err: any) {
    console.error("❌ Error in uploadData:", err.message || err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};


// 
export const updateUserData = async (req: Request, res: Response):Promise<any> => {
   try {
    const schema = req.params.schema ;
    const data = req.body.payload;
    const orgClientId = (req as any).organization?._id;

    console.log(data,"data")
    
    console.log("Upload request - Schema:", schema, "OrgId:", orgClientId, "Data:", data);
    
    if (!data) {
      return res.status(400).json({ message: "Missing required fields in payload" });
    }

    const { transactionId } = await uploadToArweave(schema, data, orgClientId?.toString());
     await updateUserDataOnBlockchain(data._id, schema, transactionId);
     return res.status(200).json({ message: "Data updated successfully" });
   } catch (err: any) {
    console.error("❌ Error in updateUserData:", err.message || err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
   }
};