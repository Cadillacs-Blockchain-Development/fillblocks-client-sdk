import { Request, Response } from "express";
import { UuidModel } from "../../models/studentUid";
 
export const geStudentUid = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params; 

    const user = await UuidModel.findOne({userId: id});
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "student uid fetched successfully" ,user});
  } catch (error) {
    return res.status(500).json({ message: "get student uid failed", error });
  }
};




