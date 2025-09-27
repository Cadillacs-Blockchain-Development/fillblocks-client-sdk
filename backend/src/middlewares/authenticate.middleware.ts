import { NextFunction, Request, Response } from "express";
import organizationModel from "../models/organization.model";
import { verifyToken } from "../libs/jwt";
import userModel from "../models/user.model";

export const authenticateMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
   const token :any= req.headers['x-auth-token'];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = verifyToken(token)

    if (!decoded?._id) {
      return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
    }

    const user = await userModel.findById((decoded as any)?._id);

    const organization = await organizationModel.findOne({organizationOwner: user?._id});

    const payload ={
        user,
        organization
    }

    if (!user ) { 
      return res.status(401).json({ message: "Unauthorized: Organization not found" });
    }

    
    (req as any).user = payload;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};
