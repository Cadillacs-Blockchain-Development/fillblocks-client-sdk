
const error = (statusCode:number,message:string)=>{
   const err = new Error() as any  ;
   err.status=statusCode
   err.message= message
   return err;
}

export default error;