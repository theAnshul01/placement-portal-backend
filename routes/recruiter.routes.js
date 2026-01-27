import express from 'express'

import verifyJWT from '../middleware/verifyJWT.js'
import checkRole from '../middleware/checkRoles.js'

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("RECRUITER"))

router.get("/ping", (req, res) => {
    res.json({ message: "Recruiter access confirmed" })
})

export default router