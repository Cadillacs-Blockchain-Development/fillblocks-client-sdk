import organizationModel from "../models/organization.model";

interface ClientCredentials {
  client: string;
  secretKey: string;
}

export const generateClientSecret  = async():Promise<ClientCredentials> =>{
    let client="";
    let secretKey="";
    let isUnique= true
    const str='caAgggvuwfr4463yrhjr298pbv0hf76t57tugejwhgs75tg36t@gg4ghba'
    while(isUnique){
        if(client.length === 36 && secretKey.length === 64){
        const checkExsting = await  organizationModel.findOne({client,secretKey});
        if(!checkExsting){
            isUnique = true;
        }
 
   for(let i=0; i<=64;i++){
        const randomIndex= Math.floor(Math.random()*str.length);
        if(client.length <=36){
            client+=str.charAt(randomIndex);
        }
        secretKey+=str.charAt(randomIndex);

    }
  
    }
}

return {
    client,
    secretKey
}
    
} 