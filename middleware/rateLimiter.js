import rateLimit from "express-rate-limit"

/*
Generic Rate Limiter factory
*/

const createRateLimiter = ({windowMs, max}) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, 
        legacyHeaders: false,

        handler: (req, res) => {
            res.status(429).json({
                message: "Too many requests. Please try again later."
            })
        }
    })
}

// auth & sensitive actions
export const authLimiter = createRateLimiter({
    windowMs: 15*60*1000,  //15 mins
    max: 20              // 20 req per IP
})

export const passwordResetLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, //1 hour
    max: 5                    // 5 req per IP
})

// Job application
export const applyJobLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, //10 mins
    max: 10                   // 10 req per IP
})

// recruiter application status update
export const applicationStatusLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,  //10 mins
    max: 30                    //30 req per IP
})