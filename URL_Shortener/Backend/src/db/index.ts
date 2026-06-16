import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env["DB_HOST"] ?? "localhost",
  port: Number(process.env["DB_PORT"] ?? "5432"),
  database: process.env["DB_NAME"] ?? "url_shortener",
  user: process.env["DB_USER"] ?? "postgres",
  password: process.env["DB_PASSWORD"] ?? "",
});

pool.on('connect', () => {
    console.log('Connected to postgres!');
});

pool.on('error', (err) => {
    console.log('Error in connecting to postgres!', err);
    process.exit(-1);
})

export default pool;