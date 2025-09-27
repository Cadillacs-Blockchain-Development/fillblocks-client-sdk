import { createDataFile } from "../utils/createDataFile";
import { generateHash, storeHash } from "../utils/hash";


export async function getAllSchemasDataUpload(dbInstance:any) {
  const models = (dbInstance as any).models;
  const schemaNames = Object.keys(models);

  if (schemaNames.length === 0) {
    console.log("⚠️ No schemas/models found in this instance.");
    return;
  }

  for (const name of schemaNames) {
    try {
      const data = await models[name].find().lean();
      console.log(models[name],data)
      const hash = generateHash(data)
      createDataFile("../data", `${name}.json`, data);
      storeHash(name,hash)
   
    } catch (err) {
      console.error(`❌ Failed to fetch data for schema "${name}":`, err);
    }
  }
}

