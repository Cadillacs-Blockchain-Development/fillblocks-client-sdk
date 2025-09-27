import { Request, Response } from "express";
import organizationModel from "../../models/organization.model";

export const updateOrganization = async (req: Request, res: Response):Promise<any> => {
    try {
        const { orgId } = req.params;
        const updates = req.body;

        const updatedOrg = await organizationModel.findByIdAndUpdate(orgId, updates, { new: true });

        if (!updatedOrg) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        res.status(200).json({
            success: true,
            organization: updatedOrg
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
