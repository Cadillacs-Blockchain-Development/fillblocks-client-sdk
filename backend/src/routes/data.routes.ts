import express, { IRouter, Router } from 'express'
import { sdkAuthenticateMiddleware } from '../middlewares/sdk.authenticate.middleware';
import { uploadData } from '../controllers/data/sdk.upload.controller';
 
const sdkUploadRoutes:IRouter =  Router()
sdkUploadRoutes.post("/upload/:schema/data",sdkAuthenticateMiddleware,uploadData)
 
export default sdkUploadRoutes;