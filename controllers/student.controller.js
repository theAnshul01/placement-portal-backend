import bcrypt from 'bcrypt'
import { generateResetToken, getResetTokenExpiry } from '../services/passwordReset.service.js'
import User from '../models/User.js'
import Student from '../models/Student.js'
import { sendPasswordResetEmail } from '../services/email.service.js'
// import mongoose from 'mongoose' //!use when using MongoDB atlas - transaction not supported on local instance



export const createStudent = async (req, res, next) => {

    // starting a mongoDB session for transaction
    // const session = await mongoose.startSession() //!use when using MongoDB atlas - transaction not supported on local instance

    try {

        // session.startTransaction() //!use when using MongoDB atlas - transaction not supported on local instance

        const { name, email, rollNumber, branch, cgpa, skills } = req.body

        if (!name || !email || !rollNumber || !branch) {
            return res.status(400).json({
                message: "Name, email, roll number, and branch are required for student registration"
            })
        }

        const existingUser = await User.findOne({ email }).lean().exec()
        if (existingUser) {
            return res.status(400).json({
                message: "Student with this email already exists."
            })
        }

        const existingRoll = await Student.findOne({ rollNumber }).lean().exec()
        if (existingRoll) {
            return res.status(400).json({
                message: "Student with this roll number already exists."
            })
        }

        const tempPassword = generateResetToken().slice(0, 10)
        const hashedPassword = await bcrypt.hash(tempPassword, 10)
        const resetToken = generateResetToken()

        // !commented code is a part of transaction and hence use it when using MongoDB atlas
        // part of transaction
        // const user = await User.create([{
        //     name,
        //     email,
        //     password: hashedPassword,
        //     role: 'STUDENT',
        //     verificationStatus: "PENDING",
        //     isActive: false,
        //     resetPasswordToken: resetToken,
        //     resetPasswordExpiresAt: getResetTokenExpiry()
        // }], { session })

        // // user is returned as an array when using create with session hence need to get the user out of user array with size 1

        // const createdUser = user[0]

        // const student = await Student.create([{
        //     userId: createdUser._id,
        //     rollNumber,
        //     branch,
        //     cgpa,
        //     skills: Array.isArray(skills) ? skills : []
        // }], { session })

        // await session.commitTransaction()//!use when using MongoDB atlas - transaction not supported on local instance
        // session.endSession()//!use when using MongoDB atlas - transaction not supported on local instance

        // part of transaction
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'STUDENT',
            verificationStatus: "PENDING",
            isActive: false,
            resetPasswordToken: resetToken,
            resetPasswordExpiresAt: getResetTokenExpiry()
        })

        const student = await Student.create({
            userId: user._id,
            rollNumber,
            branch,
            cgpa,
            skills: Array.isArray(skills) ? skills : []
        })


        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

        await sendPasswordResetEmail({
            to: email,
            name,
            resetLink
        })

        res.status(201).json({
            message: "Student created successfully. Reset password email sent.",
            student: {
                name,
                email,
                rollNumber,
                branch,
                status: "PENDING_ACTIVATION"
            }
        })

    } catch (error) {
        //  MongoDB atlas - If something fails - rollback everything
        // await session.abortTransaction()//!use when using MongoDB atlas - transaction not supported on local instance
        // session.endSession()//!use when using MongoDB atlas - transaction not supported on local instance
        next(error)
    }
}

export const resendResetPasswordEmail = async (req, res, next) => {
    try {
        const { rollNumber } = req.body

        if (!rollNumber) {
            return res.status(400).json({
                message: "Roll Number is required"
            })
        }

        const student = await Student.findOne({ rollNumber }).lean().exec()

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            })
        }

        const user = await User.findById(student.userId).exec()

        if (!user) {
            return res.status(404).json({
                message: "User record not found for this student"
            })
        }

        if (user.role != "STUDENT") {
            return res.status(400).json({
                message: "User is not a student"
            })
        }

        if (user.isActive && user.verificationStatus === "VERIFIED") {
            return res.status(400).json({
                message: "Student is already active"
            })
        }

        const resetToken = generateResetToken()

        user.resetPasswordToken = resetToken
        user.resetPasswordExpiresAt = getResetTokenExpiry()

        await user.save()

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

        await sendPasswordResetEmail({
            to: user.email,
            name: user.email,
            resetLink
        })

        res.status(200).json({
            message: "Reset password email resent successfully"
        })

    } catch (error) {
        next(error)
    }
}

export const getStudentProfile = async (req, res, next) => {
    try {
        const userId = req.user.id

        const student = await Student.findOne({ userId })
            .lean()
            .exec()

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            })
        }

        const user = await User.findById(userId)
            .select("name email role verificationStatus isActive")
            .lean()
            .exec()

        res.status(200).json({
            profile: {
                name: user.name,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
                isActive: user.isActive,

                rollNumber: student.rollNumber,
                branch: student.branch,
                isPlaced: student.isPlaced,

                createdAt: student.createdAt,
                updatedAt: student.updatedAt
            }
        })
    } catch (error) {
        next(error)
    }
}

export const updateStudentProfile = async (req, res, next) => {
    try {
        const userId = req.user.id

        const allowedUpdates = [
            'cgpa',
            'skills'
        ]

        const updates = {}

        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key]
            }
        }

        // check if req,body was not empty - nothing updated
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided for update"
            })
        }

        if (updates.skills && !Array.isArray(updates.skills)) {
            return res.status(400).json({
                message: "Skills must be an array"
            })
        }

        const student = await Student.findOneAndUpdate(
            { userId },          // student owns this profile
            { $set: updates },   // partial update
            { new: true }        // return updated document
        ).lean()

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            })
        }

        res.status(200).json({
            message: "Student profile updated successfully",
            profile: {
                rollNumber: student.rollNumber,
                branch: student.branch,
                cgpa: student.cgpa,
                skills: student.skills,
                updatedAt: student.updatedAt
            }
        })

    } catch (error) {
        next(error)
    }
}

