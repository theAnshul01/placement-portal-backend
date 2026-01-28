export const sendPasswordResetEmail = async ({
    to,
    name,
    resetLink
}) => {
    console.log(`Sending email to: ${to}`)
    console.log(`
        Hello ${name},

        Your placement portal account has been created.

        Click the link below to set your password:
        ${resetLink}

        This link is valid for 24 hours.

    `)
}