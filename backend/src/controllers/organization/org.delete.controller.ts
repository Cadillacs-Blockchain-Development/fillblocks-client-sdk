import { Request, Response } from "express";
import organizationModel from "../../models/organization.model";

export const deleteOrganization = async (req: Request, res: Response):Promise<any> => {
    try {
        const { orgId } = req.params;

        const deletedOrg = await organizationModel.findByIdAndDelete(orgId);

        if (!deletedOrg) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Organization deleted successfully"
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
