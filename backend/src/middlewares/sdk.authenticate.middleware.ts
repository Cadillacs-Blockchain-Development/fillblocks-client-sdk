import { NextFunction, Request, Response } from "express";
import organizationModel from "../models/organization.model";

export const sdkAuthenticateMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const { clientId, secretId } = req.headers;
    if (!clientId || !secretId) {
        return res.status(401).json({ message: "Unauthorized: Missing clientId or secretKey" });
    }
    const organization = await organizationModel.findOne({ clientId, secretKey:secretId });
    if (!organization) {
        return res.status(401).json({ message: "Unauthorized: Invalid clientId or secretKey" });
    }
    (req as any).organization = organization;
    next();
}