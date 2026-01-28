import express from "express"

import verifyJWT from "../middleware/verifyJWT.js"
import checkRole from "../middleware/checkRoles.js"
import upload from "../middleware/upload.js"
import { createStudent, resendResetPasswordEmail } from "../controllers/student.controller.js"

import { uploadStudentCSV } from "../controllers/studentBulk.controller.js"

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("OFFICER", "ADMIN"))

router.get("/ping", (req, res) => {
    res.status(200).json({
        message: "Officer access confirmed!"
    })
})

// endpoint for uploading bulk students
router.post("/students/upload", 
    upload.single("file"), //multer middleware, single file, form field name - "file"
    uploadStudentCSV)

// create individual user - student 
router.post("/students/createNew", createStudent)
router.post("/students/resend-reset", resendResetPasswordEmail)

export default router