import Job from '../models/Job.js'
import Recruiter from '../models/Recruiter.js'
import mongoose from 'mongoose'

export const createJob = async (req, res, next) => {
    try {
        
        const userId = req.user.id

        const recruiter = await Recruiter.findOne({userId}).lean().exec()

        if(!recruiter){
            return res.status(400).json({
                message: "Recruiter profile not found to post job"
            })
        }

        const {
            title,
            description,
            eligibility,
            jobType,
            location,
            CTC,
            deadline
        } = req.body

        if (
            !title ||
            !description ||
            !eligibility ||
            !eligibility.branches ||
            !jobType ||
            !deadline
        ) {
            return res.status(400).json({
                message: "Missing required job fields"
            })
        }

        const job = await Job.create({
            recruiterId: recruiter._id,
            companyName: recruiter.companyName,
            title,
            description,
            eligibility: {
                branches: eligibility.branches,
                minCgpa: eligibility.minCgpa
            },
            jobType,
            location,
            CTC,
            deadline,
            status: "OPEN"
        })

        res.status(201).json({
            message: "Job posted successfully",
            job: {
                id: job._id,
                company: job.companyName,
                title: job.title,
                jobType: job.jobType,
                status: job.status,
                deadline: job.deadline,
                createdAt: job.createdAt
            }
        })

    } catch (error) {
        next(error)
    }
}

export const updateJob = async (req, res, next) => {
    try {
        const { jobId } = req.params
        
        if (!mongoose.Types.ObjectId.isValid(jobId)) { //if job is not valid - 24 characters
            return res.status(400).json({
                message: "Invalid job id"
            })
        }

        const userId = req.user.id

        const recruiter = await Recruiter.findOne({ userId }).exec()

        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter profile not found for updating job"
            })
        }

        const job = await Job.findById(jobId).exec()

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            })
        }

        // check ownership if it is allowed to this recruiter to update that job
        if (job.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to update this job"
            })
        }
        
        const allowedUpdates = [
            "title",
            "description",
            "eligibility",
            "jobType",
            "location",
            "CTC",
            "deadline",
            "status"
        ]

        // updating all whichever available in body
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                job[key] = req.body[key]
            }
        }

        await job.save()

        res.status(200).json({
            message: "Job updated successfully",
            job: {
                id: job._id,
                title: job.title,
                status: job.status,
                deadline: job.deadline,
                updatedAt: job.updatedAt
            }
        })

    } catch (error) {
        next(error)
    }
}

export const getRecruiterJobs = async (req, res, next) => {
    try {
        const userId = req.user.id

        // pagination
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const { status } = req.query

        const recruiter = await Recruiter.findOne({ userId }).lean().exec()
        if(!recruiter){
            return res.status(404).json({
                message: "Recruiter profile not found"
            })
        }

        const filter = { recruiterId: recruiter._id }

        if(status){
            filter.status = status
        }

        const total = await Job.countDocuments(filter)

        const jobs = await Job.find(filter)
                        .sort({createdAt: -1})
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
            jobs
        })

    } catch (error) {
        next(error)
    }
}

export const getOpenJobs = async (req, res, next) => {
    try {
        
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const { branch, minCgpa, jobType } = req.query

        const filter = {
            status: "OPEN",
            deadline : { $gte : new Date() }
        }

        if(jobType){
            filter.jobType = jobType
        }

        if(branch){
            filter["eligibility.branches"] = branch
        }

        if(minCgpa){
            filter["eligibility.minCgpa"] = { $lte: Number(minCgpa) }
        }

        const total = await Job.countDocuments(filter)

        const jobs = await Job.find(filter)
                        .populate({
                            path: "recruiterId",
                            select: "companyName recruitingYear"
                        })
                        .sort({createdAt : -1})
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
            jobs
        })

    } catch (error) {
        next(error)
    }
}