import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/products.routes";
import categoryRoutes from "./routes/categories.routes";
import salesRoutes from "./routes/sales.routes";
import cashboxRoutes from "./routes/cashbox.routes";
import inventoryRoutes from "./routes/inventory.routes";
import { envConfig } from "./config/environment.config";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/inventory", inventoryRoutes); // Importa las rutas de inventario
app.use("/sales", salesRoutes);
app.use("/cashbox", cashboxRoutes);

const PORT = envConfig.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
