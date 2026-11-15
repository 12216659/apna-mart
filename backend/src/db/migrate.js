import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';

try {
  const schema = await readFile(
    new URL('./schema.sql', import.meta.url),
    'utf8',
  );
  await pool.query(schema);
  console.log('PostgreSQL schema is ready.');
} catch (error) {
  console.error('Unable to apply PostgreSQL schema:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
