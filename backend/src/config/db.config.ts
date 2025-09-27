import mongoose from "mongoose";

const dbConnection = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_DB_URL || "");
        console.log("Database connected successfully");
    } catch (error) {
        console.log("Database connection failed", error);
        process.exit(1);
    }
}

export default dbConnection;
