import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function seed() {
  // Categories
  const electronics = await prisma.category.create({ data: { name: "Electronics" } });
  const books = await prisma.category.create({ data: { name: "Books" } });

  // Products
  const headphones = await prisma.product.create({
    data: { name: "Headphones", price: 599, stock: 25, categories: { connect: [{ id: electronics.id }] } },
  });
  const novel = await prisma.product.create({
    data: { name: "Novel", price: 149, stock: 100, categories: { connect: [{ id: books.id }] } },
  });

  // Customers
  const alice = await prisma.customer.create({ data: { name: "Alice", email: "alice@example.com" } });
  const bob = await prisma.customer.create({ data: { name: "Bob", email: "bob@example.com" } });

  // Orders
  const order1 = await prisma.order.create({ data: { customerId: alice.id } });
  await prisma.orderItem.create({ data: { orderId: order1.id, productId: headphones.id, quantity: 1 } });
  await prisma.orderItem.create({ data: { orderId: order1.id, productId: novel.id, quantity: 2 } });

  const order2 = await prisma.order.create({ data: { customerId: bob.id } });
  await prisma.orderItem.create({ data: { orderId: order2.id, productId: novel.id, quantity: 1 } });

  console.log("Seeding complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
