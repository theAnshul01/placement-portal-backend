import crypto from 'crypto'

export const generateResetToken = () => {
    return crypto.randomBytes(32).toString("hex")
}

export const getResetTokenExpiry = () => {
    return new Date(Date.now() + 24*60*60*1000)
}