import bcrypt from 'bcrypt'
import User from '../models/User.js'
import Recruiter from '../models/Recruiter.js'

/**
 * @desc Register a new recruiter
 * @endpoint POST /api/auth/recruiter/signup
 * @access RECRUITER
 */
export const recruiterSignup = async (req, res, next) => {
    try {

        const {
            name,
            email,
            password,
            companyName,
            recruitingYear,
            companyWebsite,
            contactPerson,
            contactEmail,
            contactNumber
        } = req.body

        if (!name || !email || !password || !companyName || !recruitingYear || !contactPerson || !contactEmail) {
            return res.status(400).json({
                message: "All fields are required for recruiter sign up"
            })
        }

        const existingUser = await User.findOne({ email }).lean().exec()
        if (existingUser) {
            return res.status(409).json({
                message: "Recruiter with this email already exists"
            })
        }

        const existingRecruiter = await Recruiter.findOne({
            companyName,
            recruitingYear
        }).lean().exec()

        if (existingRecruiter) {
            return res.status(409).json({
                message: "Recruiter for this company and year already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "RECRUITER",
            verificationStatus: "PENDING",
            isActive: false
        })

        const recruiter = await Recruiter.create({
            userId: user._id,
            companyName,
            recruitingYear,
            companyWebsite,
            contactPerson,
            contactEmail,
            contactNumber,
            isVerified: false
        })

        return res.status(201).json({
            message: "Recruiter resgistered successfully. Your account is in verification state, please contact placement cell to get verified."
        })

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Recruiter already exists for this company and year"
            })
        }

        next(error)
    }
}

/**
 * @desc Verify a recruiter account
 * @endpoint PATCH /api/officers/recruiters/verify
 * @access ADMIN, OFFICER
 */
export const verifyRecruiter = async (req, res, next) => {
    try {
        const { companyName, recruitingYear } = req.body;

        if (!companyName || !recruitingYear) {
            return res.status(400).json({
                message: "All field are required for recruiter verification."
            })
        }

        const recruiter = await Recruiter.findOne({ companyName, recruitingYear }).exec()

        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter not found for given company and year"
            })
        }

        if (recruiter.isVerified) {
            return res.status(409).json({
                message: "Recruiter is already verified"
            })
        }

        const user = await User.findById(recruiter.userId).exec()

        if (!user) {
            return res.status(404).json({
                message: "User record not found for this recruiter"
            })
        }

        recruiter.isVerified = true
        recruiter.verifiedBy = req.user.id
        await recruiter.save()

        user.verificationStatus = "VERIFIED"
        user.isActive = true
        user.verifiedBy = req.user.id
        user.verifiedAt = new Date()
        await user.save()

        return res.status(200).json({
            message: "Recruiter verified successfully",
            recruiter: {
                companyName: recruiter.companyName,
                recruitingYear: recruiter.recruitingYear,
                status: "VERIFIED"
            }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * @desc Get all unverified recruiters with pagination and filters
 * @endpoint GET /api/officers/recruiters/unverified
 * @access ADMIN, OFFICER
 */
export const getUnverifiedRecruiters = async (req, res, next) => {
    try {

        // pagination
        const page = Math.max(Number(req.query.page) || 1, 1)
        const limit = Math.min(Number(req.query.limit) || 10, 50)
        const skip = (page - 1) * limit

        // optional filter
        const { recruitingYear, companyName } = req.query

        // Base filter
        const filter = {
            isVerified: false
        }

        // if recruiting year available in query params add it to the filter
        if (recruitingYear) {
            filter.recruitingYear = Number(recruitingYear)
        }

        // if companyname is provided, use regex for case-insensitive partial matching
        if (companyName) {
            filter.companyName = {
                $regex: companyName,
                $options: "i" //case insensitive
            }
        }

        const total = await Recruiter.countDocuments(filter)

        const recruiters = await Recruiter.find(filter)
            .populate({           //populate replace userid(object id) with actual user doc fields --> works for the functionality of JOIN
                path: "userId",
                select: "name email createdAt"
            })
            .sort({ createAt: -1 }) //newest recruiter first
            .skip(skip)
            .limit(limit)
            .lean() //converts to a plain JS object
            .exec()

        res.status(200).json({
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            recruiters: recruiters.map(r => ({
                id: r._id,
                companyName: r.companyName,
                recruitingYear: r.recruitingYear,
                contactPerson: r.contactPerson,
                contactEmail: r.contactEmail,
                contactNumber: r.contactNumber,
                registeredAt: r.createdAt,
                user: r.userId  //populated result
            }))
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc Get all verified recruiters with pagination and filters
 * @endpoint GET /api/officers/recruiters/verified
 * @access ADMIN, OFFICER
 */
export const getVerifiedRecruiters = async (req, res, next) => {
    try {

        const page = Math.max(Number(req.query.page) || 1, 1)
        const limit = Math.min(Number(req.query.limit) || 10, 50)
        const skip = (page - 1) * limit

        const { recruitingYear, companyName } = req.query

        const filter = {
            isVerified: true
        }

        if (recruitingYear) {
            filter.recruitingYear = Number(recruitingYear)
        }

        if (companyName) {
            filter.companyName = {
                $regex: companyName,
                $options: "i"
            }
        }

        const total = await Recruiter.countDocuments(filter) //counting total docs for recruiter

        const recruiters = await Recruiter.find(filter)
            .populate({
                path: "userId",
                select: "name email verifiedAt verifiedBy"
            })
            .sort({ updatedAt: -1 })
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
            recruiters: recruiters.map(r => ({
                id: r._id,
                companyName: r.companyName,
                recruitingYear: r.recruitingYear,
                contactPerson: r.contactPerson,
                contactEmail: r.contactEmail,
                contactNumber: r.contactNumber,
                verifiedAt: r.updatedAt,
                user: r.userId
            }))
        })


    } catch (error) {
        next(error)
    }
}

/**
 * @desc Get recruiter profile details
 * @endpoint GET /api/recruiter/profile
 * @access RECRUITER
 */
export const getRecruiterProfile = async (req, res, next) => {
    try {
        const userId = req.user.id //from JWT middleware

        const recruiter = await Recruiter.findOne({ userId })
            .lean()
            .exec()

        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter profile not found"
            })
        }

        const user = await User.findById(userId)
            .select("name email role verificationStatus isActive")
            .lean()
            .exec()

        if (!user) {
            return res.status(404).json({
                message: "User data not found for this recruiter"
            })
        }

        res.status(200).json({
            profile: {
                name: user.name,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
                isActive: user.isActive,

                companyName: recruiter.companyName,
                recruitingYear: recruiter.recruitingYear,
                companyWebsite: recruiter.companyWebsite,
                contactPerson: recruiter.contactPerson,
                contactEmail: recruiter.contactEmail,
                contactNumber: recruiter.contactNumber,
                isVerified: recruiter.isVerified,

                createdAt: recruiter.createdAt,
                updatedAt: recruiter.updatedAt
            }
        })

    } catch (error) {
        next(erorr)
    }
}

/**
 * @desc Update recruiter profile details
 * @endpoint PATCH /api/recruiter/profile
 * @access RECRUITER
 */
export const updateRecruiterProfile = async (req, res, next) => {
    try {
        const userId = req.user.id

        const allowedUpdates = [
            "companyWebsite",
            "contactPerson",
            "contactEmail",
            "contactNumber"
        ]

        const updates = {} //update object - to be build dynamically

        for (const key of allowedUpdates) {
            if (req.body[key] != undefined) {
                updates[key] = req.body[key]
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid field provided for update"
            })
        }

        const recruiter = await Recruiter.findOneAndUpdate(
            { userId },       //recruiter owns this profile
            { $set: updates }, // only update allowed fields
            { new: true }     // return updated document
        ).lean()

        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter profile not found"
            })
        }

        res.status(200).json({
            message: "Recruiter profile updated successfully",
            profile: {
                companyName: recruiter.companyName,
                recruitingYear: recruiter.recruitingYear,
                companyWebsite: recruiter.companyWebsite,
                contactPerson: recruiter.contactPerson,
                contactEmail: recruiter.contactEmail,
                contactNumber: recruiter.contactNumber,
                updatedAt: recruiter.updatedAt
            }
        })

    } catch (error) {
        next(error)
    }
}