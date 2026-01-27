import express from "express"
import verifyJWT from "../middleware/verifyJWT.js"
import checkRole from "../middleware/checkRoles.js"

const router = express.Router()

router.get('/', verifyJWT, checkRole("ADMIN", "OFFICER", "STUDENT", "RECRUITER"), (req, res) => {
    res.status(200).json({
        status: "OK",
        user: req.user,
        message: "Placement portal is working fine!"
    })
})

export default router