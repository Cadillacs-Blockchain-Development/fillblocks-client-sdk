import { Request, Response } from "express";
import userModel from "../../models/user.model";
 
export const deleteUser = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params; 

    const user = await userModel.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Delete failed", error });
  }
};
