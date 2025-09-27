import { Application, json, urlencoded ,static as static_} from "express";
import cors from "cors";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";

export const securityConfigure = (app: Application) => {
  const allowDomain = [
    "http://localhost:5173",  
    "http://localhost:8080",
    "https://hack-server.philblocks.com", 
    "https://server-dev.philblocks.com"
  ];

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false, 
      crossOriginEmbedderPolicy: false, 
    })
  );

  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ limit: "1mb", extended: true }));
  app.use("/upload",static_(path.resolve("uploads")))


  app.use(
    compression({
      level: 6,
    })
  );

  app.use(
    cors({
      origin: allowDomain,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Authorization"],
    })
  );

 
  app.use(hpp());

 
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, 
      limit: process.env.NODE_ENV === "production" ? 80 : 200, 
      standardHeaders: true,
      legacyHeaders: false,
      message: "⛔ Too many requests from this IP, please try again later.",
    })
  );
};
