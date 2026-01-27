import express from "express"
import verifyJWT from "../middleware/verifyJWT.js"
import checkRole from "../middleware/checkRoles.js"

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("ADMIN"))

router.get("/ping", (req, res) => {
    res.json({
        message: "Admin access confirmed",
        user: req.user
    })
})

export default router