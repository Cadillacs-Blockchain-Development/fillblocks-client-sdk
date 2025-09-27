import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
    organizationOwner: mongoose.Types.ObjectId;
    organizationName: string;
    aboutMe: string;
    teamSize: number;
    schemas: mongoose.Types.ObjectId[];
    clientId: string;
    secretKey: string;
    wallet: string;
    walletPrivateKey: string;
    status: "active" | "inactive" | "suspended";
    createdAt: Date;
    updatedAt: Date;
    compareSecretKey(candidateKey: string): Promise<boolean>;
}

const organizationSchema = new Schema<IOrganization>(
    {
        organizationOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        organizationName: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
            validate: {
                validator: function(v: string) {
                    return /^[a-zA-Z0-9\s\-_.]+$/.test(v);
                },
                message: "Organization name can only contain letters, numbers, spaces, hyphens, underscores, and periods"
            }
        },
        aboutMe: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500
        },
        teamSize: {
            type: Number,
            default: 1,
            min: 1,
            max: 10000
        },
        schemas: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Schema",
            default: [],
            validate: {
                validator: function(v: mongoose.Types.ObjectId[]) {
                    return v.length <= 100;  
                },
                message: "Organization cannot have more than 100 schemas"
            }
        },
        clientId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 36,
            validate: {
                validator: function(v: string) {
                    return /^[a-zA-Z0-9_-]+$/.test(v);
                },
                message: "Client ID can only contain alphanumeric characters, underscores, and hyphens"
            }
        },
        secretKey: {
            type: String,
            required: true,
            minlength: 64,
        },
        wallet: {
            type: String,
            required: true,
            trim: true
        },
          walletPrivateKey: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "suspended"],
            default: "active",
            index: true
        },
    },
    { 
        timestamps: true,
        collection: "organizations"
    }
);

 
const organizationModel = mongoose.model<IOrganization>("Organization", organizationSchema);
export default organizationModel;