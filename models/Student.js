import mongoose, { mongo } from 'mongoose'

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        rollNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        branch: {
            type: String,
            enum: ["CSE", "ECE", "EE", "ME", "CE", "AI", "ChE"],
            required: true,
        },
        cgpa: {
            type: Number,
            min: 0,
            max: 10
        },
        skills: {
            type: [String],
            default: [],
        },
        resume: {
            fileName: String,
            fileType: String,
            fileSize: Number,
            storagePath: String,
        },
        profilePhoto: {
            fileName: String,
            fileType: String,
            fileSize: Number,
            storagePath: String,
        },
        isPlaced: {
            type: Boolean,
            default: false,
        }
    }, 
    {
        timestamps: true
    }
)

export default mongoose.model('Student', studentSchema)