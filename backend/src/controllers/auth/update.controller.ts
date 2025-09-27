import { Request, Response } from "express";
import userModel from "../../models/user.model";

export const updateUser = async (req: Request, res: Response):Promise<any>  => {
  try {
    const { id } = req.params; 
    const updates = req.body;

    const user = await userModel.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Update failed", error });
  }
};