import express from 'express'

import verifyJWT from '../middleware/verifyJWT.js'
import checkRole from '../middleware/checkRoles.js'
import { getRecruiterProfile, updateRecruiterProfile } from '../controllers/recruiter.controller.js'
import { createJob, getRecruiterJobs, updateJob } from '../controllers/job.controller.js'
import { getApplicationForJob, updateApplicationStatus } from '../controllers/application.controller.js'

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("RECRUITER"))

router.get("/ping", (req, res) => {
    res.json({ message: "Recruiter access confirmed" })
})

router.get("/profile", getRecruiterProfile)
router.patch("/profile", updateRecruiterProfile)

// job related
router.post("/jobs", createJob)
router.get("/jobs", getRecruiterJobs)
router.patch("/jobs/:jobId", updateJob)
router.get("/jobs/:jobId/applications", getApplicationForJob)
router.patch("/applications/:applicationId/status", updateApplicationStatus)


export default router