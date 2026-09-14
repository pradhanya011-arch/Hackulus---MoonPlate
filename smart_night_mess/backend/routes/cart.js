import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET CART
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                cart.id,
                cart.user_id,
                cart.food_item_id,
                cart.quantity,
                food_items.name,
                food_items.price,
                food_items.image_url,
                (cart.quantity * food_items.price) AS item_total
             FROM cart
             JOIN food_items
             ON cart.food_item_id = food_items.id
             WHERE cart.user_id = $1
             ORDER BY cart.id ASC`,
            [userId]
        );

        let total = 0;

        for (const item of result.rows) {
            total += Number(item.item_total);
        }

        res.json({
            items: result.rows,
            total: total
        });

    } catch (error) {
        console.error("Error fetching cart:", error);

        res.status(500).json({
            message: "Failed to fetch cart"
        });
    }
});


// ADD TO CART
router.post("/", async (req, res) => {
    const { user_id, food_item_id, quantity } = req.body;

    if (!user_id || !food_item_id || !quantity || quantity <= 0) {
        return res.status(400).json({
            message: "user_id, food_item_id and quantity are required"
        });
    }

    try {
        // Check whether food exists
        const foodResult = await pool.query(
            `SELECT id, name, quantity, price
             FROM food_items
             WHERE id = $1`,
            [food_item_id]
        );

        if (foodResult.rows.length === 0) {
            return res.status(404).json({
                message: "Food item not found"
            });
        }

        const food = foodResult.rows[0];

        // Check current cart quantity
        const cartResult = await pool.query(
            `SELECT quantity
             FROM cart
             WHERE user_id = $1
             AND food_item_id = $2`,
            [user_id, food_item_id]
        );

        const currentQuantity =
            cartResult.rows.length > 0
                ? Number(cartResult.rows[0].quantity)
                : 0;

        const newQuantity = currentQuantity + Number(quantity);

        // Check stock
        if (newQuantity > Number(food.quantity)) {
            return res.status(400).json({
                message: `Only ${food.quantity} ${food.name} available`
            });
        }

        // Add or update cart
        const result = await pool.query(
            `INSERT INTO cart
                (user_id, food_item_id, quantity)
             VALUES
                ($1, $2, $3)
             ON CONFLICT (user_id, food_item_id)
             DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
             RETURNING *`,
            [user_id, food_item_id, quantity]
        );

        res.status(201).json({
            message: "Item added to cart",
            cart_item: result.rows[0]
        });

    } catch (error) {
        console.error("Error adding to cart:", error);

        res.status(500).json({
            message: "Failed to add item to cart"
        });
    }
});


// UPDATE CART QUANTITY
router.put("/:userId/:foodItemId", async (req, res) => {
    const { userId, foodItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be greater than 0"
        });
    }

    try {
        const foodResult = await pool.query(
            `SELECT quantity
             FROM food_items
             WHERE id = $1`,
            [foodItemId]
        );

        if (foodResult.rows.length === 0) {
            return res.status(404).json({
                message: "Food item not found"
            });
        }

        if (Number(quantity) > Number(foodResult.rows[0].quantity)) {
            return res.status(400).json({
                message: "Not enough stock"
            });
        }

        const result = await pool.query(
            `UPDATE cart
             SET quantity = $1
             WHERE user_id = $2
             AND food_item_id = $3
             RETURNING *`,
            [quantity, userId, foodItemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        res.json({
            message: "Cart updated",
            cart_item: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating cart:", error);

        res.status(500).json({
            message: "Failed to update cart"
        });
    }
});


// REMOVE FROM CART
router.delete("/:userId/:foodItemId", async (req, res) => {
    const { userId, foodItemId } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM cart
             WHERE user_id = $1
             AND food_item_id = $2
             RETURNING *`,
            [userId, foodItemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        res.json({
            message: "Item removed from cart"
        });

    } catch (error) {
        console.error("Error removing cart item:", error);

        res.status(500).json({
            message: "Failed to remove item"
        });
    }
});


// CLEAR CART
router.delete("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        await pool.query(
            `DELETE FROM cart
             WHERE user_id = $1`,
            [userId]
        );

        res.json({
            message: "Cart cleared"
        });

    } catch (error) {
        console.error("Error clearing cart:", error);

        res.status(500).json({
            message: "Failed to clear cart"
        });
    }
});


export default router;