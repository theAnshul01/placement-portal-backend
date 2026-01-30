import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        },
        status: {
            type: String,
            enum: ["APPLIED", "SHORTLISTED", "REJECTED", "SELECTED", "WITHDRAWN"],
            default: "APPLIED"
        }
    },
    {
        timestamps: true
    }
)

// composite index
applicationSchema.index(
    {studentId: 1, jobId: 1},
    {unique: true}
)

export default mongoose.model('Application', applicationSchema)