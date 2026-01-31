import mongoose from "mongoose";
import Application from '../models/Application.js'
import Job from '../models/Job.js'
import Student from '../models/Student.js'
import Recruiter from '../models/Recruiter.js'

/**
 * @desc Apply to a job
 * @endpoint POST /api/student/jobs/:jobId/apply
 * @access STUDENT
 */
export const applyToJob = async (req, res, next) => {
    try {
        const { jobId } = req.params

        const userId = req.user.id

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Invalid Job Id to apply for a job"
            })
        }

        const student = await Student.findOne({ userId }).lean().exec()

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found for job application"
            })
        }

        if (student.isPlaced) {
            return res.status(403).json({
                message: "You are already placed and cannot apply to more jobs"
            })
        }

        const job = await Job.findById(jobId).lean().exec()
        if (!job) {
            return res.status(404).json({
                message: "Job not found for job application"
            })
        }

        if (job.status != "OPEN") {
            return res.status(400).json({
                message: "Job is not open for application"
            })
        }

        if (new Date(job.deadline) < new Date()) {
            return res.status(400).json({
                message: "Job application deadline has passed"
            })
        }

        // elgibility check - branch
        if (!job?.eligibility?.branches?.includes(student.branch)) {
            return res.status(403).json({
                message: "You are not eligible for this job due to branch criteria"
            })
        }

        // eligibility check - cgpa
        if (job?.eligibility?.minCgpa > student?.cgpa) {
            return res.status(403).json({
                message: "You are not eligibile for this job due to CGPA criteria"
            })
        }

        const application = await Application.create({
            studentId: student._id,
            jobId: job._id,
        })

        return res.status(201).json({
            message: "Job applied successfully",
            application: {
                id: application._id,
                status: application.status,
                appliedAt: application.createdAt
            }
        })

    } catch (error) {
        // handling duplicate application error (unique index violation in MongoDB)
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already applied to this job"
            })
        }
        next(error)
    }
}

/**
 * @desc Get all applications submitted by the student
 * @endpoint GET /api/student/applications
 * @access STUDENT
 */
export const getMyApplication = async (req, res, next) => {
    try {
        const userId = req.user.id

        const page = req.query.page || 1
        const limit = req.query.limit || 10
        const skip = (page - 1) * 10

        const student = await Student.findOne({ userId }).lean().exec()
        if (!student) {
            return res.status(404).json({
                message: "Student profile not found for checking job applications"
            })
        }

        const total = await Application.countDocuments({
            studentId: student._id
        })

        const applications = await Application.find({
            studentId: student._id
        }).populate({
            path: "jobId",
            select: "title companyName jobType location CTC deadline status"
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec()

        res.status(200).json({
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            applications: applications.map(app => ({
                applicationId: app._id,
                status: app.status,
                appliedAt: app.createdAt,
                job: app.jobId
            }))
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc Get all applications for a specific job
 * @endpoint GET /api/recruiter/jobs/:jobId/applications
 * @access RECRUITER
 */
export const getApplicationForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params
        const userId = req.user.id

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Invalid Job Id to see applications"
            })
        }

        const page = req.query.page || 1
        const limit = req.query.limit || 10
        const skip = (page - 1) * 10

        const recruiter = await Recruiter.findOne({ userId }).lean().exec()
        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter profile not found"
            })
        }

        const job = await Job.findById(jobId).lean().exec()
        if (!job) {
            return res.status(404).json({
                message: "Job not found to see applications"
            })
        }

        if (job.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to view applications for this job"
            })
        }

        const total = await Application.countDocuments({ jobId })

        const applications = await Application.find({ jobId })
            .populate({
                path: "studentId",
                select: "rollNumber branch cgpa skills"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec()

        res.status(200).json({
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            job: {
                id: job._id,
                title: job.title,
                companyName: job.companyName
            },
            applications: applications.map(a => ({
                applicationId: a._id,
                status: a.status,
                appliedAt: a.createdAt,
                student: a.studentId //populated data - rollNumber branch cgpa skills
            }))
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc Update application status
 * @endpoint PATCH /api/recruiter/applications/:applicationId/status
 * @access RECRUITER
 */
export const updateApplicationStatus = async (req, res, next) => {
    try {

        const { applicationId } = req.params
        const userId = req.user.id
        const { status } = req.body

        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: "Application Id is not valid for updating the application status"
            })
        }

        // validate requested status
        const allowedStatus = ["SHORTLISTED", "SELECTED", "REJECTED"]
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid application status"
            })
        }

        const application = await Application.findById(applicationId).exec()
        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            })
        }

        const recruiter = await Recruiter.findOne({ userId }).lean().exec()
        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter profile not found for updating application status"
            })
        }

        const job = await Job.findById(application.jobId).exec()
        if (!job) {
            return res.status(404).json({
                message: "Job not found for this application"
            })
        }

        if (job.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to update this application"
            })
        }

        const currentStatus = application.status

        const validTransitions = {
            APPLIED: ["SHORTLISTED", "REJECTED"],
            SHORTLISTED: ["SELECTED", "REJECTED"],
            REJECTED: [],
            SELECTED: []
        }

        if (!validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                message: `Can't change application status from ${currentStatus} to ${status}`
            })
        }
        application.status = status
        await application.save()
        if (status == "SELECTED") {
            // mark the student as placed
            const studentId = application.studentId
            const student = await Student.findById(studentId).exec()
            student.isPlaced = true
            await student.save()
        }

        res.status(200).json({
            message: "Application status updated successfully",
            application: {
                id: application._id,
                status: application.status,
                updatedAt: application.updatedAt
            }
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc Withdraw a job application
 * @endpoint PATCH /api/student/applications/:applicationId/withdraw
 * @access STUDENT
 */
export const withdrawApplication = async (req, res, next) => {
    try {
        const { applicationId } = req.params
        const userId = req.user.id

        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: "Invalid application ID"
            })
        }

        const student = await Student.findOne({ userId }).exec()
        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            })
        }

        const application = await Application.findById(applicationId).exec()
        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            })
        }

        if (application.studentId.toString() !== student._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to withdraw this application"
            })
        }

        const withdrawAllowedStatus = ["APPLIED", "SHORTLISTED"]

        if (!withdrawAllowedStatus.includes(application.status)) {
            return res.status(400).json({
                message: `Application cannot be withdrawn when status is ${application.status}`
            })
        }

        application.status = "WITHDRAWN"
        await application.save()

        res.status(200).json({
            message: "Application withdrawn successfully",
            application: {
                id: application._id,
                status: application.status,
                withdrawnAt: application.updatedAt
            }
        })

    } catch (error) {
        next(error)
    }
}   