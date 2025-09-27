import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { organizationApiDoc } from "./organization.docs";
import { userApiDoc } from "./user.docs";


const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Philblocks SDK Server API",
    version: "1.0.0",
    description: `
      API documentation for **Philblocks SDK Server** and related Cadillacs services.
      This includes endpoints for authentication, organizations, wallets, and more.
    `,
    contact: {
      name: "Cadillacs Dev Team",
      email: "contact@cadillacs.in",
      url: "https://cadillacs.in",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:8080/api",
      description: "Local development server",
    },
    {
      url: "https://hack-server.philblocks.com/api",
      description: "Production API",
    },
  ],
  paths: {
    ...userApiDoc.paths,
    ...organizationApiDoc.paths
  },
};


export const swaggerDocs = (app: Application, port: number) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📑 Swagger docs available at http://localhost:${port}/api-docs`);
};


 