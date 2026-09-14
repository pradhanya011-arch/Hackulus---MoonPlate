import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../db.js";
import protect from "./protect.js";

const router = express.Router();

const cookieOptions = {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite:
        process.env.NODE_ENV === "production"
            ? "none"
            : "lax",

    maxAge: 30 * 24 * 60 * 60 * 1000
};

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d"
        }
    );
};


/*
    REGISTER
    POST /auth/register
*/
router.post("/register", async (req, res) => {

    try {

        const { name, email, password,hostel_id } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check existing user
        const existingUser = await pool.query(
            `SELECT id
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        // Create user
        const result = await pool.query(
            `INSERT INTO users
                (name, email, password)
             VALUES
                ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [
                name.trim(),
                normalizedEmail,
                hashedPassword
            ]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = generateToken(user.id);

        // Store JWT in HTTP-only cookie
        res.cookie(
            "token",
            token,
            cookieOptions
        );

        return res.status(201).json({
            user
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
});


/*
    LOGIN
    POST /auth/login
*/
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT *
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = generateToken(user.id);

        res.cookie(
            "token",
            token,
            cookieOptions
        );

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
});


/*
    CURRENT USER
    GET /auth/me
*/
router.get("/me", protect, async (req, res) => {

    return res.json({
        user: req.user
    });

});


/*
    LOGOUT
    POST /auth/logout
*/
router.post("/logout", (req, res) => {

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax"
    });

    return res.json({
        message: "Logged out successfully"
    });

});


export default router;