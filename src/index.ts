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
import { envConfig } from "./config/environment.config";

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = envConfig.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
