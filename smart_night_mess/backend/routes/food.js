import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all food items
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM food_items ORDER BY id ASC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching food:", error);

        res.status(500).json({
            message: "Failed to fetch food items"
        });
    }
});

export default router;