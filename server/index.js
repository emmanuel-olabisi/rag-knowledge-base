require("dotenv").config()

const express = require("express")
const cors = require("cors")
const authRoutes = require("./routes/authRoutes")
const documentRoutes = require("./routes/documentRoutes")
const evalRoutes = require("./routes/evalRoutes")

const app = express()
app.use(express.json())
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use("/api/auth", authRoutes)
app.use("/api/documents", documentRoutes)
app.use("/api/eval", evalRoutes)


const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log(`server running on ${PORT}`)
})

