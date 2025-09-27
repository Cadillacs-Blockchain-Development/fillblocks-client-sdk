import { accessSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

interface Credentials {
  clientId: string;
  secretId: string;
  dbName: string;
}

 
export  function createCredentialsFile(
  folderName: string,
  fileName: string,
  credentials: Credentials
) {
  const folderPath = path.resolve(__dirname, folderName);
   mkdirSync(folderPath, { recursive: true })
  const filePath = path.join(folderPath, fileName);
  
  try {

     accessSync(filePath);
    return;
  } catch {
    const content = JSON.stringify(credentials, null, 2);
     writeFileSync(filePath, content);
  }
}
