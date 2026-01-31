import mongoose from "mongoose";
import { MONGO_URI } from './env.js'

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log('MongoDB connection established')
    } catch (error) {
        console.error('MongoDB connection failed')
        process.exit(1) //!fail fast if any error occurs
    }
}

export default connectDB