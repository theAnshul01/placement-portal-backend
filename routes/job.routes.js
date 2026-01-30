import express from 'express'
import { getOpenJobs } from '../controllers/job.controller.js'
import checkRole from '../middleware/checkRoles.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("ADMIN", "STUDENT", "OFFICER"))

router.get("/", getOpenJobs)

export default router