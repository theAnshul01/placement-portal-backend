import express from 'express'

import verifyJWT from '../middleware/verifyJWT.js'
import checkRole from '../middleware/checkRoles.js'
import { getRecruiterProfile, updateRecruiterProfile } from '../controllers/recruiter.controller.js'
import { createJob, getRecruiterJobs, updateJob } from '../controllers/job.controller.js'

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
router.patch("/jobs/:jobId", updateJob)
router.get("/jobs", getRecruiterJobs)

export default router