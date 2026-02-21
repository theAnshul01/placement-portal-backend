import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import s3 from "../config/s3.js"
import { AWS_BUCKET_NAME } from "../config/env.js"

export const generateSignedUrl = async (fileKey) => {
    const command = new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: fileKey
    })

    return await getSignedUrl(s3, command, {
        expiresIn: 60 * 10 // 10 minutes
    })
}