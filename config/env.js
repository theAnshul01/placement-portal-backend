import dotenv from 'dotenv'

dotenv.config()

export const {
    PORT,
    MONGO_URI,
    NODE_ENV,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET
} = process.env
