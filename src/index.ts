import "dotenv/config";
import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Webshop API is running." });
});

// POST /products
app.post("/products", async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// GET /products?category=Electronics&minPrice=10&maxPrice=100
app.get("/products", async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
        categories: category ? { some: { name: { equals: String(category) } } } : undefined,
      },
      include: { categories: true },
    });
    res.json(products);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// PATCH /products/:productId
app.patch("/products/:productId", async (req, res) => {
  try {
    const updated = await prisma.product.update({
      where: { id: Number(req.params.productId) },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// DELETE /orders/:orderId
app.delete("/orders/:orderId", async (req, res) => {
  try {
    await prisma.orderItem.deleteMany({ where: { orderId: Number(req.params.orderId) } });
    const deleted = await prisma.order.delete({ where: { id: Number(req.params.orderId) } });
    res.json(deleted);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
