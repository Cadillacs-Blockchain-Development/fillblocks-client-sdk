import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    email: string;
    name: string;
    phone?: string;
    country?: string;
    profileUrl?: string;
    password?: string;
    isEmailVerified: boolean;
    status: "active" | "inactive" | "suspended";
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    phone: {
        type: String,
        required: false,
        trim: true,
    },
    country: {
        type: String,
        required: false,
        trim: true,
        maxlength: [50, "Country name cannot exceed 50 characters"]
    },
    profileUrl: {
        type: String,
        required: false,
        default: "",
        trim: true,
    },
    password: {
        type: String,
        required: false,
        minlength: [8, "Password must be at least 8 characters long"],
        maxlength: [128, "Password cannot exceed 128 characters"],
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active",
        index: true
    },
   
}, {
    timestamps: true,
    collection: "users"
});


const userModel = mongoose.model<IUser>("User", userSchema);
export default userModel;