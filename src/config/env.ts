import  dotenv from "dotenv";
dotenv.config();
export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/myecommerce";
export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || "production";

export const JWT_SECRET = process.env.JWT_SECRET || "helloiamsecret123";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";