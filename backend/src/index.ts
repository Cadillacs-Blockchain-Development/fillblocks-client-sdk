import express, { Application, Request, Response ,} from "express";
import "dotenv/config";
import { arweaveSetup } from "./arwaves/arwaves";
import { setupServerWallet } from "./blockchain/server.wallet";
import { securityConfigure } from "./security/securityConfigure";
import { configureRoutes } from "./routes/index";
import dbConnection from "./config/db.config";
import { swaggerDocs } from "./docs/swagger.config";
import path from "path";

const app: Application = express();
const port = process.env.PORT || 8081;

securityConfigure(app)
configureRoutes(app)
swaggerDocs(app, Number(port));


app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html")); 
});

app.listen(port, async (error?: any) => {
  if (error) {
    console.log("\x1b[41m\x1b[37m ❌ Server failed to start \x1b[0m", error);
    throw error;
  }

  console.log(
    `\x1b[32m✅ Server is running!\x1b[0m \x1b[34mhttp://localhost:${port}\x1b[0m`
  );
  console.log("\x1b[33m🚀 Booting up ArLocal...\x1b[0m");
  // await arweaveSetup();
  await dbConnection();
  console.log(  await setupServerWallet(),"ddd")
    // console.log( await generateClientSecret(),"ddd")                                                   
  console.log("\x1b[35m🔗 Arweave Local is ready! 🎉\x1b[0m");
});
