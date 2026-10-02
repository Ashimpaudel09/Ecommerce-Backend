import express from "express";
import pinoHttp from "pino-http";

import { logger } from "./lib/logger";
import { errorMiddleware } from "./middleware/error.middleware";
import authRouter from "./modules/auth/auth.routes";
import usersRouter from "./modules/users/users.routes";
import productsRouter from "./modules/products/products.routes";
import cartRouter from "./modules/cart/cart.routes";
import paymentRoutes from "./modules/payment/payment.routes";

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(errorMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payments", paymentRoutes);

export default app;
