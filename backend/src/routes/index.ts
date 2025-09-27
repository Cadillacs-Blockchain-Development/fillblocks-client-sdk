import { Application } from "express";
import authRoutes from "./auth.routes";
import organizationRoutes from "./organization.routes";
import sdkUploadRoutes from "./data.routes";
import arwavesRoutes from "./arwaves.routes";
 

export const configureRoutes = (app:Application)=>{
    app.use("/api/auth",authRoutes)
    app.use("/api/sdk",sdkUploadRoutes)
    app.use("/api/organization",organizationRoutes)
    app.use("/api/arwaves",arwavesRoutes)
}

  