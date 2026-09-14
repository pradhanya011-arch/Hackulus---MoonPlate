import express from "express";
import Razorpay from "razorpay";
import pool from "../db.js";
import crypto from "crypto";

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ========================================
// CREATE RAZORPAY ORDER
// ========================================
router.post("/create/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

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

        const amountInPaise = Math.round(
            Number(order.total_amount) * 100
        );

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: order.order_number
        });

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
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error(
            "Razorpay order creation error:",
            error
        );

        res.status(500).json({
            message: "Failed to create Razorpay order"
        });
    }
});


// ========================================
// VERIFY PAYMENT + GENERATE QR TOKEN
// ========================================
router.post("/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Check required values
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Missing payment details"
            });
        }

        // Find payment record
        const paymentResult = await pool.query(
            `SELECT
                id,
                order_id,
                razorpay_order_id,
                amount,
                status
             FROM payments
             WHERE razorpay_order_id = $1`,
            [razorpay_order_id]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Payment record not found"
            });
        }

        const payment = paymentResult.rows[0];

        // Generate expected Razorpay signature
        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        // Verify signature
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Invalid payment signature"
            });
        }

        // Update payment
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

        // ========================================
        // GENERATE UNIQUE QR TOKEN
        // ========================================

        const qrToken = crypto
            .randomBytes(32)
            .toString("hex");

        // Mark order PAID and attach QR token
        const orderResult = await pool.query(
            `UPDATE orders
             SET status = 'PAID',
                 qr_token = $1,
                 qr_redeemed = FALSE
             WHERE id = $2
             RETURNING
                id,
                order_number,
                status,
                qr_token,
                qr_redeemed`,
            [
                qrToken,
                payment.order_id
            ]
        );

        const updatedOrder = orderResult.rows[0];

        // ========================================
        // SEND SUCCESS RESPONSE
        // ========================================

        res.json({
            message: "Payment verified successfully",

            orderId: updatedOrder.id,

            orderNumber: updatedOrder.order_number,

            paymentId: razorpay_payment_id,

            status: "PAID",

            qrToken: updatedOrder.qr_token,

            qrRedeemed: updatedOrder.qr_redeemed
        });

    } catch (error) {
        console.error(
            "Payment verification error:",
            error
        );

        res.status(500).json({
            message: "Payment verification failed"
        });
    }
});


export default router;