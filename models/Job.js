import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        recruiterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recruiter',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        eligibility: {
            branches:{
                type: [String],
                required: true
            },
            minCgpa: {
                type: Number,
                min: 0,
                max: 10
            }
        },
        jobType: {
            type: String,
            enum: ["Internship", "Full-Time"],
            required: true
        },
        location: {
            type: String,
        },
        CTC: {
            type: String
        },
        deadline: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["OPEN", "CLOSED", "WITHDRAWN"],
            default: "OPEN"
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('Job', jobSchema)