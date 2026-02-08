import bcrypt from 'bcrypt'
import User from '../models/User.js'
import {
    generateAccessToken,
    generateRefreshToken
} from '../services/token.service.js'
import jwt from 'jsonwebtoken'
import { REFRESH_TOKEN_SECRET } from '../config/env.js'

/**
 * @desc Create a new admin user
 * @endpoint POST /api/bootstrap/admin
 * @access ADMIN
 */
export const createAdmin = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const existingUser = await User.findOne({ email }).exec()

        if (existingUser) {
            return res.status(409).json({
                message: "Admin already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "ADMIN",
            verificationStatus: "VERIFIED",
            isActive: true
        })

        res.status(201).json({
            message: "Admin created successfully",
            adminId: admin._id
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc User login - returns access token and refresh token
 * @endpoint POST /api/auth/login
 * @access STUDENT, ADMIN, OFFICER, RECRUITER
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const user = await User.findOne({ email }).exec()

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "User is inactive"
            })
        }

        if (user.verificationStatus !== "VERIFIED") {
            return res.status(403).json({
                message: "User is not verified"
            })
        }

        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const payload = {
            id: user._id,
            role: user.role,
            name: user.name
        }

        const accessToken = generateAccessToken(payload)
        const refreshToken = generateRefreshToken(payload)

        user.refreshToken = refreshToken

        await user.save()

        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: false, //!true in production
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.status(200).json({
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        next(error)
    }
}

/**
 * @desc Refresh access token using refresh token from cookies
 * @endpoint GET /api/auth/refresh
 * @access STUDENT, ADMIN, OFFICER, RECRUITER
 */
export const refresh = async (req, res, next) => {
    try {
        const cookies = req.cookies

        if (!cookies?.jwt) {
            return res.status(401).json({
                message: "No refresh token found"
            })
        }

        const refreshToken = cookies.jwt

        jwt.verify(
            refreshToken,
            REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        message: "Invalid refresh token"
                    })
                }

                const user = await User.findById(decoded.id).lean().exec()

                if (!user || user.refreshToken !== refreshToken) {
                    return res.status(403).json({
                        message: "Refresh token mismatch"
                    })
                }

                if (!user.isActive) {
                    return res.status(403).json({
                        message: "User is inactive"
                    })
                }

                const payload = {
                    id: user._id,
                    role: user.role,
                    name: user.name
                }

                const newAccessToken = generateAccessToken(payload)

                return res.status(200).json({
                    accessToken: newAccessToken
                })
            }
        )
    } catch (error) {
        next(error)
    }
}

/**
 * @desc User logout - clears refresh token from database and cookies
 * @endpoint POST /api/auth/logout
 * @access STUDENT, ADMIN, OFFICER, RECRUITER
 */
export const logout = async (req, res, next) => {
    try {
        const cookies = req.cookies

        if (!cookies?.jwt) {
            // no cookie exist -> already logged out
            return res.sendStatus(204)
        }

        const refreshToken = cookies.jwt

        const user = await User.findOne({ refreshToken }).exec()

        if (user) {
            user.refreshToken = null
            await user.save()
        }

        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "Strict",
            secure: false //! true in production
        })

        res.status(200).json({
            message: "Logged out successfully"
        })
    } catch (error) {
        next(error)
    }
}

/**
 * @desc Reset user password using reset token
 * @endpoint POST /api/auth/reset-password
 * @access STUDENT, ADMIN, OFFICER, RECRUITER
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required"
            })
        }

        // find user by reset token
        const user = await User.findOne({ resetPasswordToken: token }).exec()

        if (!user) {
            return res.status(400).json({
                message: "Invalid or already used reset token"
            })
        }

        if (user?.resetPasswordExpiresAt < Date.now()) {
            return res.status(400).json({
                message: "Reset token has expired"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        user.password = hashedPassword

        user.isActive = true
        user.verificationStatus = "VERIFIED"

        user.verifiedAt = new Date()
        user.verifiedBy = null

        // invalidate resettoken props
        user.resetPasswordToken = null
        user.resetPasswordExpiresAt = null

        await user.save()

        return res.status(200).json({
            message: "Password reset successful. You can now login"
        })

    } catch (error) {
        next(error)
    }
}   