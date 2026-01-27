import brcypt from 'bcrypt'
import User from '../models/User.js'
import {
    generateAccessToken,
    generateRefreshToken
} from '../services/token.service.js'
import jwt from 'jsonwebtoken'
import { REFRESH_TOKEN_SECRET } from '../config/env.js'

export const createAdmin = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        if(!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const existingUser = await User.findOne({ email }).exec()

        if(existingUser){
            return res.status(409).json({
                message: "Admin already exists"
            })
        }

        const hashedPassword = await brcypt.hash(password, 10)

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

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if(!email || !password){
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const user = await User.findOne({ email }).exec()

        if(!user){
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        if(!user.isActive){
            return res.status(403).json({
                message: "User is inactive"
            })
        }

        if(user.role !== "ADMIN" && 
            user.verificationStatus !== "APPROVED"
        ){
            return res.status(403).json({
                message: "User is not verified"
            })
        }

        const isPasswordMatch = await brcypt.compare(
            password,
            user.password
        )

        if(!isPasswordMatch){
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
            maxAge: 7 * 24 * 60 * 60
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

export const refresh = async (req, res, next) => {
    try {
        const cookies = req.cookies

        if(!cookies?.jwt){
            return res.status(401).json({
                message: "No refresh token found"
            })
        }

        const refreshToken = cookies.jwt

        jwt.verify(
            refreshToken,
            REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if(err) {
                    return res.status(403).json({
                        message: "Invalid refresh token"
                    })
                }

                const user = await User.findById(decoded.id).lean().exec()

                if(!user || user.refreshToken !== refreshToken){
                    return res.status(403).json({
                        message: "Refresh token mismatch"
                    })
                }

                if(!user.isActive){
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

export const logout = async (req, res, next) => {
    try {
        const cookies = req.cookies

        if(!cookies?.jwt){
            // no cookie exist -> already logged out
            return res.sendStatus(204)
        }

        const refreshToken = cookies.jwt

        const user = await User.findOne({ refreshToken }).exec()

        if(user){
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

// ! for testing purpose only
export const createStudent = async (req, res, next) => {
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
                message: "Student already exists"
            })
        }

        const hashedPassword = await brcypt.hash(password, 10)

        const student = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "STUDENT",
            verificationStatus: "VERIFIED",
            isActive: true
        })

        res.status(201).json({
            message: "Student created successfully",
            adminId: student._id
        })

    } catch (error) {
        next(error)
    }
}