import { Request, Response } from "express";
import { uploadToArweave } from "../../arwaves/upload.arweves";
import { generateUuid,initializeStudentDataStream } from "../../blockchain/blockchainFxn"; 


export const uploadData = async (req: Request, res: Response): Promise<any> => {
  try {
    const schema = req.params.schema || "user";
    const data = req.body.payload;
    const orgClientId = (req as any).organization;

    if (!data) {
      return res.status(400).json({ message: "Missing required fields in payload" });
    }

    const { transactionId } = await uploadToArweave(schema, data, orgClientId._id);
    const {logs} = await generateUuid(data._id, data.schoolId);
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
