import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import {NODE_ENV} from '../config/env.js'

const transports = []

if(NODE_ENV === "production"){
    transports.push(
        new DailyRotateFile({
            filename: "logs/requests/%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "7d"
        })
    )
}

if(NODE_ENV === "development"){
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ level, message, timestamp }) => {
                    return `${timestamp} ${level}: ${JSON.stringify(message)}`
                })
            )
        })
    )
}

export const requestLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports : transports
})