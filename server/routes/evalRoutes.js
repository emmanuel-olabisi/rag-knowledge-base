require("dotenv").config()

const express = require("express")
const jwt = require("jsonwebtoken")
const { getRetrievalMetrics } = require("../services/evalService")

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({ success: false, message: "unauthorized" })
    }

    try {
        const token = authHeader.split(" ")[1]
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        return res.status(401).json({ success: false, message: "invalid token" })
    }
}

router.get("/metrics", authenticate, async (req, res) => {
    try {
        const metrics = await getRetrievalMetrics(req.user.userID)
        res.json({ success: true, data: metrics })
    } catch (error) {
        console.log("eval metrics error:", error)
        res.status(500).json({ success: false, message: "server error" })
    }
})

module.exports = router
