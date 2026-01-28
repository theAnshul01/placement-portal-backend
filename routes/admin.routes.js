import express from "express"
import verifyJWT from "../middleware/verifyJWT.js"
import checkRole from "../middleware/checkRoles.js"
import { createOfficer, deactivateOfficer, reactivateOfficer } from "../controllers/admin.controller.js"

const router = express.Router()

router.use(verifyJWT)
router.use(checkRole("ADMIN"))

// create officers
router.post("/officers", createOfficer)
router.patch("/officers/:officerId/deactivate", deactivateOfficer)
router.patch("/officers/:officerId/reactivate", reactivateOfficer)


router.get("/ping", (req, res) => {
    res.json({
        message: "Admin access confirmed",
        user: req.user
    })
})


export default router