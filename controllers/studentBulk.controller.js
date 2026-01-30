import fs from 'fs'
import csv from 'csv-parser'
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import Student from '../models/Student.js'
import { generateResetToken, getResetTokenExpiry } from '../services/passwordReset.service.js'
import { sendPasswordResetEmail } from '../services/email.service.js'
import { FRONTEND_URL } from '../config/env.js'

export const uploadStudentCSV = async (req, res, next) => {
    try {
        
        if(!req.file){
            return res.status(400).json({
                message: "CSV file is required"
            })
        }

        const results = []  //store all parsed rows from CSV
        const errors = []  //store row-level errors without stopping the process

        fs.createReadStream(req.file.path) //creating a readbale stream from uploaded csv file
            .pipe(csv()) //piping the file stream into csv-parser
            .on("data", (row) => { //fired for each row in CSV
                results.push(row)
            })
            .on("end", async () => { //fired once the entire CSV file is read
                let created = 0; //count of successfully created student
                for(let i = 0; i < results.length; i++){
                    const row = results[i]

                    try {
                        
                        const {
                            name,
                            email,
                            rollNumber,
                            branch,
                            cgpa,
                            skills
                        } = row

                        if(!name || !email || !rollNumber || !branch){
                            throw new Error("Missing required fields")
                        }

                        const existingUser = await User.findOne({ email })
                        if(existingUser){
                            throw new Error("Duplicate email")
                        }

                        const existingRoll = await Student.findOne({ rollNumber })
                        if(existingRoll){
                            throw new Error("Duplicate roll number")
                        }

                        const tempPassword = generateResetToken().slice(0, 10)
                        const hashedPassword = await bcrypt.hash(tempPassword, 10)
                        const resetToken = generateResetToken()

                        const user = await User.create({
                            name,
                            email,
                            password: hashedPassword,
                            role: "STUDENT",
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
                            skills: skills ? skills.split("|") : []
                        })

                        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`

                        await sendPasswordResetEmail({
                            to: email,
                            name,
                            resetLink
                        })

                        created++

                    } catch (error) {
                        errors.push({
                            row: i+1, //CSV row number
                            reason: error.message
                        })
                    }
                }

                return res.status(201).json({
                    message: "Student CSV processed",
                    summary: {
                        total: results.length,
                        created,
                        failed: errors.length
                    },
                    errors
                })
            })

    } catch (error) {
        next(error)
    }
}