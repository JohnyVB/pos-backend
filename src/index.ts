import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/products.routes";
import categoryRoutes from "./routes/categories.routes";
import salesRoutes from "./routes/sales.routes";
import cashboxRoutes from "./routes/cashbox-sessions.routes";
import inventoryRoutes from "./routes/inventory.routes";
import terminalRoutes from "./routes/terminals.routes";
import storeRoutes from "./routes/stores.routes";
import cashMovementRoutes from "./routes/cash-movements.routes";
import reportRoutes from "./routes/reports.routes";
import promotionRoutes from "./routes/promotions.routes";
import barRoutes from "./routes/bar.routes";
import { envConfig } from "./config/environment.config";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/sales", salesRoutes);
app.use("/cashbox-sessions", cashboxRoutes);
app.use("/terminals", terminalRoutes);
app.use("/stores", storeRoutes);
app.use("/cash-movements", cashMovementRoutes);
app.use("/reports", reportRoutes);
app.use("/promotions", promotionRoutes);
app.use("/bar", barRoutes);

const port = Number(envConfig.port ?? 5000);
app.listen(port, "0.0.0.0", () => console.log(`Server running http://localhost${port}`));
