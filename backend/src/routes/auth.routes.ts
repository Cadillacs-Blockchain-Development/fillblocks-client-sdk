import express, { IRouter, Router } from 'express'
import { signup } from '../controllers/auth/signup.controller'
import { login } from '../controllers/auth/login.controller'
import { loginWithGoogle } from '../controllers/auth/google.login.controller'
import { updateUser } from '../controllers/auth/update.controller'
import { deleteUser } from '../controllers/auth/delete.controller'
import { authenticateMiddleware } from '../middlewares/authenticate.middleware'

const authRoutes:IRouter =  Router()
authRoutes.post("/login",login)
authRoutes.post("/signup",signup)
authRoutes.post("/login-with-google",loginWithGoogle)
authRoutes.put("/update/user/:id",authenticateMiddleware,updateUser)
authRoutes.delete("/delete/user/:id",authenticateMiddleware,deleteUser)

export default authRoutes;