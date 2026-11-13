import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pool } from './config/database.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const app = express();
const port = Number(process.env.PORT) || 5000;
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

const createAuthResponse = customer => ({
  token: jwt.sign({ sub: String(customer.id) }, jwtSecret, { expiresIn: '7d' }),
  user: {
    name: customer.name,
    username: customer.username,
    phone: customer.phone,
    email: customer.email,
  },
});

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
});

app.post('/api/auth/register', authRateLimit, async (req, res) => {
  const { name, username, phone, password } = req.body ?? {};
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedUsername =
    typeof username === 'string' ? username.trim().toLowerCase() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

  if (normalizedName.length < 1 || normalizedName.length > 80) {
    return res
      .status(400)
      .json({ message: 'Name must be between 1 and 80 characters.' });
  }

  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(normalizedUsername)) {
    return res.status(400).json({
      message:
        'Username must be 3-30 letters, numbers, dots, underscores or hyphens.',
    });
  }

  if (normalizedPhone && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
    return res
      .status(400)
      .json({ message: 'Enter a valid 10-digit mobile number.' });
  }

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res
      .status(400)
      .json({ message: 'Password must be between 8 and 72 characters.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO customers (name, username, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, username, phone, email`,
      [
        normalizedName,
        normalizedUsername,
        normalizedPhone || null,
        await bcrypt.hash(password, 12),
      ],
    );
    return res.status(201).json(createAuthResponse(rows[0]));
  } catch (error) {
    if (error?.code === '23505') {
      return res
        .status(409)
        .json({
          message: 'That username or phone number is already registered.',
        });
    }

    throw error;
  }
});

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  const { identifier, password } = req.body ?? {};
  const normalizedIdentifier =
    typeof identifier === 'string' ? identifier.trim() : '';

  if (
    !normalizedIdentifier ||
    typeof password !== 'string' ||
    password.length < 1 ||
    password.length > 72
  ) {
    return res
      .status(400)
      .json({ message: 'Enter your username or phone number and password.' });
  }

  const isPhone = /^\d{10}$/.test(normalizedIdentifier);
  const column = isPhone ? 'phone' : 'username';
  const value = isPhone
    ? normalizedIdentifier
    : normalizedIdentifier.toLowerCase();
  const { rows } = await pool.query(
    `SELECT id, name, username, phone, email, password_hash
     FROM customers
     WHERE ${column} = $1
     LIMIT 1`,
    [value],
  );
  const customer = rows[0];

  if (
    !customer?.password_hash ||
    !(await bcrypt.compare(password, customer.password_hash))
  ) {
    return res
      .status(401)
      .json({ message: 'Invalid username/phone number or password.' });
  }

  return res.json(createAuthResponse(customer));
});

app.post('/api/auth/google', authRateLimit, async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({
      message:
        'Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the frontend and backend.',
    });
  }

  const { credential } = req.body ?? {};
  if (typeof credential !== 'string' || credential.length > 4096) {
    return res
      .status(400)
      .json({ message: 'A valid Google credential is required.' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Google credential verification failed:', error.message);
    return res
      .status(401)
      .json({ message: 'Google account could not be verified.' });
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res
      .status(401)
      .json({ message: 'Google account could not be verified.' });
  }

  const email = payload.email.toLowerCase();
  const existing = await pool.query(
    `SELECT id, name, username, phone, email, google_id
     FROM customers
     WHERE google_id = $1 OR email = $2
     LIMIT 1`,
    [payload.sub, email],
  );
  let customer = existing.rows[0];

  if (customer && !customer.google_id) {
    const linked = await pool.query(
      `UPDATE customers
       SET google_id = $1, email = $2, updated_at = now()
       WHERE id = $3
       RETURNING id, name, username, phone, email`,
      [payload.sub, email, customer.id],
    );
    customer = linked.rows[0];
  } else if (!customer) {
    const created = await pool.query(
      `INSERT INTO customers (name, email, google_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, username, phone, email`,
      [(payload.name || email).slice(0, 80), email, payload.sub],
    );
    customer = created.rows[0];
  }

  return res.json(createAuthResponse(customer));
});

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res
      .status(400)
      .json({ message: 'Request body must be valid JSON.' });
  }

  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const start = async () => {
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is missing. Set it in backend/.env before starting the API.',
    );
    process.exit(1);
  }

  if (!jwtSecret || jwtSecret.length < 32) {
    console.error(
      'JWT_SECRET must be set to a random secret of at least 32 characters in backend/.env.',
    );
    process.exit(1);
  }

  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL.');
    app.listen(port, () => {
      console.log(`Apna Mart API listening on port ${port}.`);
    });
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error.message);
    await pool.end();
    process.exit(1);
  }
};

await start();
