import express from "express";
import Razorpay from "razorpay";
import pool from "../db.js";
import crypto from "crypto";
const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        // Get MoonPlate order
        const orderResult = await pool.query(
            `SELECT id, order_number, total_amount, status
             FROM orders
             WHERE id = $1`,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orderResult.rows[0];

        if (order.status !== "PENDING_PAYMENT") {
            return res.status(400).json({
                message: "Order is not waiting for payment"
            });
        }

        // Razorpay amount must be in paise
        const amountInPaise = Math.round(
            Number(order.total_amount) * 100
        );

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: order.order_number
        });

        // Save payment information
        await pool.query(
            `INSERT INTO payments
             (order_id, razorpay_order_id, amount, status)
             VALUES ($1, $2, $3, $4)`,
            [
                order.id,
                razorpayOrder.id,
                order.total_amount,
                "CREATED"
            ]
        );

        res.json({
            message: "Razorpay order created",
            orderId: order.id,
            orderNumber: order.order_number,
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Razorpay order creation error:", error);

        res.status(500).json({
            message: "Failed to create Razorpay order"
        });
    }
});
router.post("/verify", async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Check required values
        if (
            !orderId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Missing payment details"
            });
        }

        // Get payment record from our database
        const paymentResult = await pool.query(
            `SELECT id, order_id, razorpay_order_id, amount, status
             FROM payments
             WHERE order_id = $1
             AND razorpay_order_id = $2`,
            [orderId, razorpay_order_id]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Payment record not found"
            });
        }

        const payment = paymentResult.rows[0];

        // Create the signature using our Razorpay secret
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        // Compare Razorpay signature with our generated signature
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Invalid payment signature"
            });
        }

        // Payment is verified
        await pool.query(
            `UPDATE payments
             SET razorpay_payment_id = $1,
                 razorpay_signature = $2,
                 status = 'VERIFIED'
             WHERE id = $3`,
            [
                razorpay_payment_id,
                razorpay_signature,
                payment.id
            ]
        );

        res.json({
            message: "Payment verified successfully",
            orderId: payment.order_id,
            paymentId: razorpay_payment_id,
            status: "VERIFIED"
        });

    } catch (error) {
        console.error("Payment verification error:", error);

        res.status(500).json({
            message: "Payment verification failed"
        });
    }
});

export default router;