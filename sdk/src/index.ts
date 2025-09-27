import mongoose from "mongoose";
import { createCredentialsFile } from "./utils/createCredentialsFile";
import { getAllSchemasDataUpload } from "./services/getAllData";
import cron from "node-cron";

interface ConnectOptions {
  clientId: string;
  secretId: string;
  dbName: string;
  mongooseInstance:any
}

export class ConnectPhilblocks {
  private clientId: string;
  private secretId: string;
  private dbName: string;
 private  mongooseInstance:string;
  private creds: { clientId: string; secretId: string; dbName: string };
  private cronStarted = false;

  constructor(options: ConnectOptions) {
    this.clientId = options.clientId;
    this.secretId = options.secretId;
    this.dbName = options.dbName;
    this.mongooseInstance=options.mongooseInstance
    this.creds = {
      clientId: this.clientId,
      secretId: this.secretId,
      dbName: this.dbName,
    };

    this.init();
    this.scheduleUpload();
  }

  private async init() {
    try {
      createCredentialsFile("../config", "credentials.json", this.creds);
      console.log("✅ Credentials file created");
    } catch (err) {
      console.error("❌ Initialization failed:", err);
    }
  }

  getDbConfigStatus() {
    const state = mongoose.connection.readyState;
    switch (state) {
      case 0:
        return "🔴 Disconnected";
      case 1:
        return "🟢 Connected";
      case 2:
        return "🟡 Connecting...";
      case 3:
        return "🟠 Disconnecting...";
      default:
        return "⚪ Unknown state";
    }
  }

  private scheduleUpload() {
     
      this.startCron();
  
  }

  private startCron() {
    if (this.cronStarted) return; 
    this.cronStarted = true;
    cron.schedule("*/5 * * * * *", async () => {
      try {
        await getAllSchemasDataUpload(this.mongooseInstance);
        console.log("🔄 Running scheduled schema upload...");
      } catch (err) {
        console.error("❌ Failed during scheduled upload:", err);
      }
    });

    console.log("✅ Cron job started (every 5s)");
  }
}
