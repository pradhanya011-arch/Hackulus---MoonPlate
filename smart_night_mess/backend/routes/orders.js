import express from "express";
import pool from "../db.js";

const router = express.Router();


// ===============================
// CREATE ORDER FROM CART
// ===============================
router.post("/from-cart/:userId", async (req, res) => {

    const { userId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Get cart items with food details
        const cartResult = await client.query(
            `SELECT
                cart.food_item_id,
                cart.quantity,
                food_items.name,
                food_items.price,
                food_items.quantity AS available_stock
             FROM cart
             JOIN food_items
                ON cart.food_item_id = food_items.id
             WHERE cart.user_id = $1`,
            [userId]
        );

        // Check empty cart
        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Your cart is empty"
            });
        }


        // 2. Check stock and calculate total
        let totalAmount = 0;

        for (const item of cartResult.rows) {

            if (Number(item.quantity) > Number(item.available_stock)) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: `Not enough stock for ${item.name}. Available: ${item.available_stock}`
                });
            }

            totalAmount +=
                Number(item.quantity) * Number(item.price);
        }


        // 3. Create order
        const orderResult = await client.query(
            `INSERT INTO orders
                (order_number, user_id, total_amount, status)
             VALUES
                ('TEMP', $1, $2, 'PENDING_PAYMENT')
             RETURNING id, user_id, total_amount, status, created_at`,
            [userId, totalAmount]
        );

        const order = orderResult.rows[0];


        // 4. Generate MP1, MP2, MP3...
        const orderNumber = `MP${order.id}`;

        await client.query(
            `UPDATE orders
             SET order_number = $1
             WHERE id = $2`,
            [orderNumber, order.id]
        );


        // 5. Copy cart items into order_items
        for (const item of cartResult.rows) {

            await client.query(
                `INSERT INTO order_items
                    (order_id, food_item_id, quantity, price)
                 VALUES
                    ($1, $2, $3, $4)`,
                [
                    order.id,
                    item.food_item_id,
                    item.quantity,
                    item.price
                ]
            );
        }


        // 6. Clear user's cart
        await client.query(
            `DELETE FROM cart
             WHERE user_id = $1`,
            [userId]
        );


        // 7. Finish transaction
        await client.query("COMMIT");


        // 8. Send response
        res.status(201).json({
            message: "Order created successfully",

            order: {
                id: order.id,
                order_number: orderNumber,
                user_id: order.user_id,
                total_amount: totalAmount,
                status: "PENDING_PAYMENT",
                created_at: order.created_at
            },

            items: cartResult.rows.map(item => ({
                food_item_id: item.food_item_id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                item_total:
                    Number(item.quantity) *
                    Number(item.price)
            }))
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Order creation error:", error);

        res.status(500).json({
            message: "Failed to create order"
        });

    } finally {

        client.release();

    }
});


export default router;