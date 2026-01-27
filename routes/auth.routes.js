import express from 'express'
import { createAdmin, login, refresh, logout, createStudent } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/bootstrap/admin', createAdmin)
router.post('/auth/login', login)
router.get('/auth/refresh', refresh)
router.post('/auth/logout', logout)

router.post('/bootstrap/student', createStudent)

export default router;