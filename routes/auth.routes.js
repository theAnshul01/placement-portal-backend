import express from 'express'
import { createAdmin, login, refresh, logout, resetPassword } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/bootstrap/admin', createAdmin) //! only admin creation purpose to avoid DB seeding
router.post('/auth/login', login)
router.get('/auth/refresh', refresh)
router.post('/auth/logout', logout)
router.post('/auth/reset-password', resetPassword)

export default router;