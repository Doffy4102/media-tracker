import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL || "postgresql://localhost:5432/media_tracker";
const adapter = new PrismaPg({ connectionString: url });

const prisma = new PrismaClient({ adapter });

export default prisma;
