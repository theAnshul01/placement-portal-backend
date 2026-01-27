import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB connection established')
    } catch (error) {
        console.error('MongoDB connection failed')
        process.exit(1) //!fail fast if any error occurs
    }
}

export default connectDB