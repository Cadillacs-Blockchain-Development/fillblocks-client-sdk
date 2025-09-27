import { Request, Response } from "express";
import userModel from "../../models/user.model";
import bcrypt from "bcryptjs"
import { generateToken } from "../../libs/jwt";

export const login = async (req: Request, res: Response):Promise<any>  => {
  try {
 const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload ={
      _id:(user as any)?._id.toString(),
      email:(user as any)?.email ?? ""
    }
    const token = generateToken(payload);
    console.log(token)

    res.cookie("authToken", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production"?"none" :"lax",    
    secure:( process.env.NODE_ENV as any)=== "production" ? true : false,   
    path:"/" ,   
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

     user.password = ""
    return res.json({
      message: "Login successful",
      token, 
      user: user,
    });

  } catch (error) {
    return res.status(500).json({ message: "Login failed", error });
  }
};
