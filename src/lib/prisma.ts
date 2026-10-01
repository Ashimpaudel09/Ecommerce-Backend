import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { DATABASE_URL } from "../config/env";

const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
});

export const prisma = new PrismaClient({
    adapter,
});