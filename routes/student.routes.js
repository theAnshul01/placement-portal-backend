import express from 'express'

import verifyJWT from '../middleware/verifyJWT.js'
import checkRole from '../middleware/checkRoles.js'

import { getStudentProfile, updateStudentProfile } from '../controllers/student.controller.js'

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("STUDENT"))

router.get("/ping", (req, res) => {
    res.json({ message: "Student access confirmed"})
})

router.get("/profile", getStudentProfile)
router.patch("/profile", updateStudentProfile)

export default router

