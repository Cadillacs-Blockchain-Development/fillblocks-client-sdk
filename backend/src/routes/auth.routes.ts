import express, { IRouter, Router } from 'express'
import { signup } from '../controllers/auth/signup.controller'
import { login } from '../controllers/auth/login.controller'
import { loginWithGoogle } from '../controllers/auth/google.login.controller'
import { updateUser } from '../controllers/auth/update.controller'
import { deleteUser } from '../controllers/auth/delete.controller'
import { authenticateMiddleware } from '../middlewares/authenticate.middleware'
import { geStudentUid } from '../controllers/auth/get.uid.controller'
import {  getLastStudentRecord } from '../controllers/data/get.arwaves.controller'

const authRoutes:IRouter =  Router()
authRoutes.post("/login",login)
authRoutes.post("/signup",signup)
authRoutes.post("/login-with-google",loginWithGoogle)
authRoutes.put("/update/user/:id",authenticateMiddleware,updateUser)
authRoutes.delete("/delete/user/:id",authenticateMiddleware,deleteUser)
authRoutes.get("/get/student/uid/:id",authenticateMiddleware,geStudentUid)
authRoutes.get("/get/student/data/:schema/:studentId",authenticateMiddleware, getLastStudentRecord)

export default authRoutes;