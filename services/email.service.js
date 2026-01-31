import SibApiV3Sdk from 'sib-api-v3-sdk'
import { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } from '../config/env.js'

const client = SibApiV3Sdk.ApiClient.instance

// Configure API key
const apiKey = client.authentications['api-key']
apiKey.apiKey = BREVO_API_KEY


const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi()

export const sendPasswordResetEmail = async ({
    to,
    name,
    resetLink
}) => {
    try {
        const emailData = {
            sender: {
                email: BREVO_SENDER_EMAIL,
                name: BREVO_SENDER_NAME
            },
            to: [
                {
                    email: to,
                    name
                }
            ],
            subject: "Set your Placement Portal password",
            htmlContent: `
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your Placement Portal account has been created.</p>
                <p>Please click the link below to set your password:</p>
                <p>
                    <a href="${resetLink}" target="_blank">
                        Reset Password
                    </a>
                </p>
                <p>This link is valid for <strong>24 hours</strong>.</p>
                <br/>
                <p>— Placement Cell</p>
            `
        }

        await transactionalEmailApi.sendTransacEmail(emailData)

    } catch (error) {
        console.error("Brevo email error:", error.response?.body || error)
        throw new Error("Failed to send password reset email")
    }
}
