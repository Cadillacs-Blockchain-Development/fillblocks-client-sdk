import express, { IRouter, Router } from 'express'
import { authenticateMiddleware } from '../middlewares/authenticate.middleware';
import { getDataBySchema, getSingleUserHistory, getUniqueSchemas } from '../controllers/data/get.arwaves.controller';
 
const arwavesRoutes:IRouter =  Router()
 
arwavesRoutes.get("/schema/:schema",authenticateMiddleware, getDataBySchema);
arwavesRoutes.get("/schema/:schema/user/:userId/history",authenticateMiddleware, getSingleUserHistory);
arwavesRoutes.get("/schemas/unique",authenticateMiddleware, getUniqueSchemas);
 
export default arwavesRoutes;