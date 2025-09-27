import { accessSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
 

 
export  function createDataFile(
  folderName: string,
  fileName: string,
  data: any
) {
  const folderPath = path.resolve(__dirname, folderName);
   mkdirSync(folderPath, { recursive: true })
  const filePath = path.join(folderPath, fileName);
  try {
     accessSync(filePath);
    return;
  } catch {
    const content = JSON.stringify(data, null, 2);
     writeFileSync(filePath, content);
  }
}

