import mongoose, { Connection } from "mongoose";

/**
 * Returns the current active mongoose connection
 * (null if not connected yet).
 */

export const getCurrentDbInstance = (): Connection | null => {
    return mongoose.connection.readyState ? mongoose.connection :null
 
};

