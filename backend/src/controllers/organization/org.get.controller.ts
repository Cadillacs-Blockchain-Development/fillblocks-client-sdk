import { Request, Response } from "express";
import organizationModel from "../../models/organization.model";

export const getOrganizationDetails = async (req: Request, res: Response):Promise<any> => {
    try {
        const { orgId } = req.params;

        const organization = await organizationModel
            .findById(orgId).populate("organizationOwner"); 

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        res.status(200).json({
            success: true,
            organization
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
