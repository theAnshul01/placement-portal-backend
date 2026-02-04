import { errorLogger } from '../logger/errorLogger.js'

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    errorLogger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originUrl,
        user: req.user?.id || null
    })

    res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error"
    })
}

export default errorHandler