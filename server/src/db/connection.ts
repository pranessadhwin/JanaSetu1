import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const poolConfig = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
  : {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "app_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

export const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool);

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("✅ MySQL Database connected successfully!");
    return true;
  } catch (err: any) {
    console.warn("⚠️  Could not connect to MySQL database on laptop:", err.message);
    console.warn("👉 Please ensure MySQL is running, database 'app_db' exists, and credentials in server/.env are correct.");
    return false;
  }
}
