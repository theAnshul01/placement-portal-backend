import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["ADMIN", "OFFICER", "STUDENT", "RECRUITER"],
        required: true,
    },
    verificationStatus: {
        type: String,
        enum: ["PENDING", "VERIFIED", "REJECTED"],
        default: "PENDING",
    },
    isActive: {
        type: Boolean,
        required: true,
    },
    refreshToken: {
        type: String,
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: {
        type: Date
    },
    deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deactivatedAt: {
        type: Date,
    },
    deactivationReason: {
        type: String,
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpiresAt: {
        type: Date
    }
}, 
{ 
    timestamps: true
}
)

export default mongoose.model('User', userSchema)