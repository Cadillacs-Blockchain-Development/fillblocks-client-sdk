import { Request, Response } from "express";
import organizationModel from "../../models/organization.model";
import { generateWallet } from "../../blockchain/generate.wallet";
import { generateClientSecret } from "../../utils/generate.client";

export const createOrganization = async (req: Request, res: Response):Promise<any> => {
    try {
        const { organizationOwner, organizationName, aboutMe, teamSize } = req.body;

        const existingOrg = await organizationModel.findOne({ organizationOwner });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: "Owner already has an organization."
            });
        }

        const data = await generateClientSecret();

        const { address, privateKey }:any = generateWallet();

        const newOrg = await organizationModel.create({
            organizationOwner,
            organizationName,
            aboutMe,
            teamSize,
            wallet: address,
            walletPrivateKey: privateKey,
            clientId: data?.client ?? "",
            secretKey: data?.secretKey ?? ""
        });

        res.status(201).json({
            success: true,
            organization: newOrg,
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
