import "dotenv/config";
import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const app = express();

app.use(express.json());

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.headers["x-api-key"] !== process.env.ADMIN_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/", (_req, res) => {
  res.json({ message: "Webshop API is running." });
});

// POST /products
app.post("/products", requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// GET /products?category=Electronics&minPrice=10&maxPrice=100&page=1&limit=10
app.get("/products", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, page, limit } = req.query;
    const take = limit ? Number(limit) : 10;
    const skip = page ? (Number(page) - 1) * take : 0;
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
        categories: category ? { some: { name: { equals: String(category) } } } : undefined,
      },
      include: { categories: true },
      skip,
      take,
    });
    res.json(products);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// PATCH /products/:productId
app.patch("/products/:productId", requireAdmin, async (req, res) => {
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
app.delete("/orders/:orderId", requireAdmin, async (req, res) => {
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
