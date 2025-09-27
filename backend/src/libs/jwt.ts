import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = "7d";

 
export const generateToken = (user: any): string => {
  try {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (err: any) {
    console.error("❌ Error generating JWT:", err.message || err);
    throw new Error("Failed to generate JWT token");
  }
};

export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded || typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }
    return decoded as any;
  } catch (err: any) {
    console.error("❌ JWT verification failed:", err.message || err);
    throw new Error("Invalid or expired token");
  }
};
