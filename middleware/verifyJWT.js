import jwt from 'jsonwebtoken'
import { ACCESS_TOKEN_SECRET } from '../config/env.js'

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if(!authHeader?.startsWith("Bearer ")){
        return res.status(401).json({
            message: "Authorization token missing | Unauthorized"
        })
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
        token,
        ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err){
                return res.status(403).json({
                    message: "Invalid or expired token" 
                })
            }

            req.user = {
                id: decoded?.id,
                role: decoded?.role,
                name: decoded?.name
            }

            next()
        }
    )

}

export default verifyJWT