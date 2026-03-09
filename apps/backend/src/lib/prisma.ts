import { PrismaClient } from '@prisma/client';

// Initialize a singleton instance of the Prisma Client
const prisma = new PrismaClient();

export default prisma;
