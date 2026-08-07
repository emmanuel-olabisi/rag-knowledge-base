require("dotenv").config()

const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../db/db")

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

function getUniqueViolationMessage(error) {
    if (error.constraint === "users_email_key") {
        return "email already in use"
    }
    if (error.constraint === "users_username_key") {
        return "username already in use"
    }
    return "account already exists"
}

router.post("/signup", async (req, res) => {
    try {
        const username = (req.body.username || "").trim()
        const email = (req.body.email || "").trim()
        const password = req.body.password || ""

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "all fields are required",
            })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "invalid email address",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await pool.query(
            "INSERT INTO users(username, email, password) VALUES($1, $2, $3)",
            [username, email, hashedPassword]
        )

        res.json({
            success: true,
            message: "account created successfully",
        })
    } catch (error) {
        console.log("signup error:", error.code, error.constraint)

        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: getUniqueViolationMessage(error),
            })
        }

        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
})

router.post("/login", async (req, res) => {
    try {
        const username = (req.body.username || "").trim()
        const password = req.body.password || ""

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "username and password are required",
            })
        }

        const databaseResult = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        )

        if (databaseResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "username not found",
            })
        }

        const passwordMatches = await bcrypt.compare(
            password,
            databaseResult.rows[0].password
        )
        if (!passwordMatches) {
            return res.status(400).json({
                success: false,
                message: "incorrect password",
            })
        }

        const token = jwt.sign(
            {
                userID: databaseResult.rows[0].id,
                username: databaseResult.rows[0].username,
            },
            JWT_SECRET
        )

        res.json({
            success: true,
            token,
        })
    } catch (error) {
        console.log("login error:", error)
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
})

module.exports = router
