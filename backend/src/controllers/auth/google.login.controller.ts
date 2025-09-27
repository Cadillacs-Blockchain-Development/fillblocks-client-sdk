import { Request, Response } from "express";
import userModel from "../../models/user.model";
import bcrypt from "bcryptjs"
import { generateToken } from "../../libs/jwt";


export const loginWithGoogle = async (req: Request, res: Response):Promise<any> => {
  try {
    const { email, name, profileUrl } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({ email, name, profileUrl, isEmailVerified: true });
    }

    const payload ={
      _id:(user as any)?._id.toString(),
      email:(user as any)?.email ?? ""
    }
    const token = generateToken(payload);

    res.cookie("authToken", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production"?"none" :"lax",    
    secure:( process.env.NODE_ENV as any)=== "production" ? true : false,   
    path:"/" ,   
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    });
    
     user.password = ""
    return res.json({
      message: "Google login successful",
      token,
      user: user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Google login failed", error });
  }
};