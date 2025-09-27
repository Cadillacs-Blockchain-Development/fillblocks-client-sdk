import express, { IRouter, Router } from 'express'
import { createOrganization } from '../controllers/organization/org.create.controller'
import { updateOrganization } from '../controllers/organization/org.update.controller'
import { deleteOrganization } from '../controllers/organization/org.delete.controller'
import { getOrganizationDetails } from '../controllers/organization/org.get.controller'

const organizationRoutes:IRouter =  Router()
organizationRoutes.post("/create",createOrganization)
organizationRoutes.put("/update/:orgId",updateOrganization)
organizationRoutes.delete("/delete/:orgId",deleteOrganization)
organizationRoutes.get("/:orgId",getOrganizationDetails)
export default organizationRoutes;