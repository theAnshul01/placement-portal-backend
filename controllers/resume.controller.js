import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import s3 from "../config/s3.js"
import crypto from "crypto"
import Student from "../models/Student.js"
import { AWS_BUCKET_NAME } from "../config/env.js"

export const uploadResumeController = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" })
        }

        const student = await Student.findOne({ userId: req.user.id })

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" })
        }

        if (student.resume?.storagePath) {
            return res.status(400).json({
                message: "Resume already exists. Please delete it before uploading a new one."
            })
        }

        const fileKey = `resumes/${req.user.id}-${crypto.randomUUID()}.pdf`

        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        })

        await s3.send(command)

        student.resume = {
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            storagePath: fileKey
        }

        await student.save()

        res.json({
            message: "Resume uploaded successfully"
        })

    } catch (error) {
        next(error)
    }
}

export const deleteResumeController = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" })
        }

        if (!student.resume?.storagePath) {
            return res.status(400).json({ message: "No resume found to delete" })
        }

        const deleteCommand = new DeleteObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: student.resume.storagePath
        })

        await s3.send(deleteCommand)

        student.resume = undefined

        await student.save()

        res.json({ message: "Resume deleted successfully" })
    } catch (error) {
        next(error)
    }
}