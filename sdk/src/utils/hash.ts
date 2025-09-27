import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";



const HASH_FOLDER = path.resolve(__dirname, "hash");
const HASH_FILE = path.join(HASH_FOLDER, "schema_hashes.json");


 export function generateHash(content: string) {
  const hash = createHash("sha256");
  const input = Array.isArray(content) ? JSON.stringify(content) : String(content);
  hash.update(input);
  return hash.digest("hex");
}
 

 

export const storeHash = (schema: string, hash: string) => {
  const folderPath = path.resolve(__dirname, "hash");
  mkdirSync(folderPath, { recursive: true });

  const filePath = path.join(folderPath, "schema_hashes.json");
  let hashData: Record<string, string> = {};

  if (existsSync(filePath)) {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      hashData = JSON.parse(fileContent);
    } catch (err) {
      console.error("⚠️ Failed to read existing hash file. Overwriting.", err);
      hashData = {};
    }
  }

  hashData[String(schema)] = hash;

  writeFileSync(filePath, JSON.stringify(hashData, null, 2), "utf-8");
  console.log(`✅ Hash stored/updated for schema "${schema}"`);
};



export const getAllHashes = (): Record<string, string> => {
  if (!existsSync(HASH_FILE)) return {};

  try {
    return JSON.parse(readFileSync(HASH_FILE, "utf-8"));
  } catch (err) {
    console.error("⚠️ Failed to read hash file.", err);
    return {};
  }
};