import app from './app.js'
import connectDB from '../config/db.js'
import { PORT } from '../config/env.js'

const startServer = async () => {
    await connectDB()

    app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`)
    })
}

startServer()