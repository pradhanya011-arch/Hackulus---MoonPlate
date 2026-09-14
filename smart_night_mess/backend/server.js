import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import foodRoutes from "./routes/food.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";

import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        message: "MoonPlate backend is running"
    });
});

app.use("/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: "Something went wrong"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`MoonPlate server running on port ${PORT}`);
});