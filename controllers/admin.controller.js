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
                message: "Officer is alread deactivated"
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