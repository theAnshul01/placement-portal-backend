import morgan from "morgan";
import { requestLogger } from "./requestLogger.js";

const httpLogger = morgan(
    (tokens, req, res) => {
        return JSON.stringify({
            method: tokens.method(req, res),
            url: tokens.url(req, res),
            status: Number(tokens.status(req, res)),
            responseTime: `${tokens["response-time"](req, res)} ms`,
            ip: req.ip,
            user: req.user?.id || null
        })
    },
    {
        stream: {
            write: message => {
                requestLogger.info(JSON.parse(message))
            }
        }
    }
)

export default httpLogger