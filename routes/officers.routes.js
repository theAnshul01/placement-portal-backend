import express from "express"

import verifyJWT from "../middleware/verifyJWT.js"
import checkRole from "../middleware/checkRoles.js"

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("OFFICER"))

router.get("/ping", (req, res) => {
    res.status(200).json({
        message: "Officer access confirmed!"
    })
})

export default router