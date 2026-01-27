import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        companyName: {
            type: String,
            required: true,
            trim: true
        },
        recruitingYear: {
            type: Number,
            required: true
        },
        companyWebsite: {
            type: String
        },
        contactPerson:{
            type: String,
            required: true
        },
        contactEmail: {
            type: String,
            required: true,
            lowercase: true,
        },
        contactNumber: {
            type: String
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

// preventing same company registering twice for same year
recruiterSchema.index(
    {companyName: 1, recruitingYear: 1},
    {unique: true}
);

export default mongoose.model('Recruiter', recruiterSchema)