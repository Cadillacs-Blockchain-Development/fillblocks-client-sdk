import { Request, Response } from "express";
import userModel from "../../models/user.model";
import bcrypt from "bcryptjs"

export const signup = async (req: Request, res: Response):Promise<any> => {
  try {
    const { email, name, password, phone, country } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await userModel.create({
      email,
      name,
      phone,
      country,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error });
  }
};
 