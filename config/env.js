import dotenv from 'dotenv'

dotenv.config()

export const {
    PORT,
    MONGO_URI,
    NODE_ENV,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    BREVO_API_KEY,
    BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME,
    FRONTEND_URL
} = process.env
