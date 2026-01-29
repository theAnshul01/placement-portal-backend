import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import errorHandler from '../middleware/errorHandler.js'
import healthRoutes from '../routes/health.routes.js'
import authRoutes from '../routes/auth.routes.js'
import adminRoutes from '../routes/admin.routes.js'
import studentRoutes from '../routes/student.routes.js'
import recruiterRoutes from '../routes/recruiter.routes.js'
import officerRoutes from '../routes/officers.routes.js'
import jobRoutes from '../routes/job.routes.js'

const app = express()

// parse JSON body
app.use(express.json())

// parse cookies
app.use(cookieParser())

// enable CORS
app.use(cors({
    origin: true,
    credentials: true
}))

// routes
app.use("/health", healthRoutes)
app.use("/api", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/student", studentRoutes)
app.use("/api/recruiter", recruiterRoutes)
app.use("/api/officer", officerRoutes)
app.use("/jobs", jobRoutes)

//! error handler at last to catch failures
app.use(errorHandler)

export default app
