import { NextFunction, Request, Response } from "express";
import organizationModel from "../models/organization.model";

export const sdkAuthenticateMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const headers = req.headers;
     console.log(headers.clientid)
    if (!headers.clientid || !headers.secretid) {
        return res.status(401).json({ message: "Unauthorized: Missing clientId or secretKey" });
    }
    const organization = await organizationModel.findOne({ clientId:headers.clientid, secretKey:headers.secretid });
     
    if (!organization) {
        return res.status(401).json({ message: "Unauthorized: Invalid clientId or secretKey" });
    }
    (req as any).organization = organization;
    next();
}