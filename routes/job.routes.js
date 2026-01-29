import express from 'express'
import { getOpenJobs } from '../controllers/job.controller.js'

const router = express.Router()

router.get("/", getOpenJobs)

export default router