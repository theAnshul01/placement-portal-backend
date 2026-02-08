import mongoose from 'mongoose';
import User from '../models/User.js'
import bcrypt from 'bcrypt'

/**
 * @desc Create a new officer user
 * @endpoint POST /api/admin/officers
 * @access ADMIN
 */
export const createOfficer = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const existingUser = await User.findOne({ email }).lean().exec()
        if (existingUser) {
            return res.status(409).json({
                message: "Officer with this email already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const officer = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "OFFICER",
            verificationStatus: "VERIFIED",
            isActive: true,
            verifiedBy: req.user.id,  //available through JWT verification
            verifiedAt: new Date()
        })

        res.status(201).json({
            message: "Officer created successfully",
            officer: {
                id: officer._id,
                name: officer.name,
                email: officer.email,
                role: officer.role
            },
            createdBy: req.user.name
        })

    } catch (error) {
        next(error)
    }
}

/*
* @desc Get all officers
* @endpoint GET /api/admin/officers
* @access ADMIN
*/
export const getAllOfficers = async (req, res, next) => {
    try {

        const page = Math.max(Number(req.query.page) || 1, 1)
        const limit = Math.min(Number(req.query.limit) || 10, 50)
        const skip = (page - 1) * limit

        const filter = {
            role: "OFFICER"
            
        }

        const total = await User.countDocuments(filter)

        const officers = await User.find(filter)
                                .select("_id name email role isActive")
                                .sort({updatedAt: -1})
                                .skip(skip)
                                .limit(limit)
                                .lean()
                                .exec()
        
        return res.status(200).json({
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            officers
        })
    } catch (error) {
        next(error)
    }
}

/*
* @desc Get all students
* @endpoint GET /api/admin/officers
* @access ADMIN
*/
export const getAllStudents = async (req, res, next) => {
    try {

        const page = Math.min(Number(req.query.page) || 1, 1)
        const limit = Math.max(Number(req.query.limit) || 10, 50)
        const skip = (page - 1) * limit

        const filter = {
            role: "STUDENT"
        }

        const total = await User.countDocuments(filter)

        const students = await User.find(filter)
            .select("_id name email role isActive")
            .sort({createdAt : -1})
            .skip(skip)
            .limit(limit)
            .lean()
            .exec()

        return res.status(200).json({
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            students
        })
    } catch (error) {
        next(error)
    }
}

/** 
 * @desc Deactivate a Student
 * @endpoint PATCH /api/admin/students/:studentId/deactivate
 * @access ADMIN
*/
export const deactivateStudent = async(req, res, next) => {
    try {
        const {studentId} = req.params
        const {reason} = req.body

        if(!mongoose.Types.ObjectId.isValid(studentId)){
            return res.status(400).json({
                message: "Invalid student id"
            })
        }

        if(!reason){
            return res.status(400).json({
                message: "Reason is required field"
            })
        }

        const student = await User.findById(studentId).exec()

        if(!student){
            return res.status(404).json({
                message: "User not found"
            })
        }

        if(student.role !== "STUDENT"){
            return res.status(400).json({
                message: "targeted user is not a student"
            })
        }

        if(!student.isActive){
            return res.status(400).json({
                message: "user is already deactivated."
            })
        }

        student.isActive = false;
        student.deactivatedBy = req.user.id
        student.deactivatedAt = new Date()
        student.deactivationReason = reason || `Deactivated by ${req.user.name}`

        await student.save()

        res.status(200).json({
            message: "Student deactivated successfully",
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                isActive: student.isActive
            }
        })

    } catch (error) {
        next(error)
    }
}


/**
 * @desc Reactivate a student
 * @endpoint PATCH /api/admin/students/:studentId/reactivate
 * @access ADMIN
 */
export const reactivateStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                message: "Invalid student id"
            })
        }

        const student = await User.findById(studentId).exec()

        if (!student) {
            return res.status(404).json({
                message: "student not found"
            })
        }

        if (student.role != "STUDENT") {
            return res.status(400).json({
                message: "Targeted user is not a student"
            })
        }

        if (student.isActive) {
            return res.status(409).json({
                message: "Student is already active"
            })
        }

        student.isActive = true
        student.verifiedBy = req.user.id
        student.verifiedAt = new Date()
        student.deactivatedAt = null
        student.deactivatedBy = null
        student.deactivationReason = null

        await student.save()

        res.status(200).json({
            message: "Student reactivated successfully",
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                isActive: student.isActive
            }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * @desc Deactivate an officer
 * @endpoint PATCH /api/admin/officers/:officerId/deactivate
 * @access ADMIN
 */
export const deactivateOfficer = async (req, res, next) => {
    try {

        const { officerId } = req.params
        const { reason } = req.body

        if (!mongoose.Types.ObjectId.isValid(officerId)) {
            return res.status(400).json({
                message: "Invalid officer id"
            })
        }

        if(!reason){
            return res.status(400).json({
                message: "Reason is required field"
            })
        }

        const officer = await User.findById(officerId).exec()

        if (!officer) {
            return res.status(404).json({
                message: "officer not found"
            })
        }

        if (officer.role != "OFFICER") {
            return res.status(400).json({
                message: "Targeted user is not an officer"
            })
        }

        if (!officer.isActive) {
            return res.status(409).json({
                message: "Officer is already deactivated"
            })
        }

        officer.isActive = false
        officer.deactivatedBy = req.user.id
        officer.deactivatedAt = new Date()
        officer.deactivationReason = reason || `Deactivated by ${req.user.name}`

        await officer.save()

        res.status(200).json({
            message: "Officer deactivated successfully",
            officer: {
                id: officer._id,
                name: officer.name,
                email: officer.email,
                isActive: officer.isActive
            }
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc Reactivate a deactivated officer
 * @endpoint PATCH /api/admin/officers/:officerId/reactivate
 * @access ADMIN
 */
export const reactivateOfficer = async (req, res, next) => {
    try {

        const { officerId } = req.params

        if (!mongoose.Types.ObjectId.isValid(officerId)) {
            return res.status(400).json({
                message: "Invalid officer id"
            })
        }

        const officer = await User.findById(officerId).exec()

        if (!officer) {
            return res.status(404).json({
                message: "officer not found"
            })
        }

        if (officer.role != "OFFICER") {
            return res.status(400).json({
                message: "Targeted user is not an officer"
            })
        }

        if (officer.isActive) {
            return res.status(409).json({
                message: "Officer is already active"
            })
        }

        officer.isActive = true
        officer.verifiedBy = req.user.id
        officer.verifiedAt = new Date()
        officer.deactivatedAt = null
        officer.deactivatedBy = null
        officer.deactivationReason = null

        await officer.save()

        res.status(200).json({
            message: "Officer reactivated successfully",
            officer: {
                id: officer._id,
                name: officer.name,
                email: officer.email,
                isActive: officer.isActive
            }
        })

    } catch (error) {
        next(error)
    }
}