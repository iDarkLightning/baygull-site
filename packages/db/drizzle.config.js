import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config({
    path: "../../.env",
});
export default defineConfig({
    schema: "./src/*",
    dialect: "turso",
    dbCredentials: {
        url: process.env.DATABASE_URL,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    },
});
