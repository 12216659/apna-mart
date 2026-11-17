import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import authenticateCustomer from '../middleware/authenticateCustomer.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const normalizeUsername = value =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizePhone = value =>
  typeof value === 'string' ? value.trim().replace(/[\s()-]/g, '') : '';

const publicCustomer = customer => ({
  id: String(customer.id),
  name: customer.name,
  username: customer.username,
  phone: customer.phone,
  email: customer.email,
  role: customer.role || 'customer',
  accountStatus: customer.account_status || 'active',
  authProvider: customer.auth_provider || 'password',
});

const createAuthResponse = (customer, jwtSecret) => ({
  token: jwt.sign({ sub: String(customer.id) }, jwtSecret, {
    expiresIn: '7d',
  }),
  user: publicCustomer(customer),
});

const duplicateErrorResponse = (error, res) => {
  if (error?.code !== '23505') return false;
  const constraint = String(error.constraint || '').toLowerCase();
  if (constraint.includes('username')) {
    res.status(409).json({
      code: 'USERNAME_TAKEN',
      message: 'Username already taken. Please choose another username.',
    });
  } else if (constraint.includes('phone')) {
    res.status(409).json({
      code: 'PHONE_TAKEN',
      message:
        'You already have an account with this mobile number. Please login instead.',
    });
  } else {
    res.status(409).json({
      code: 'ACCOUNT_ALREADY_EXISTS',
      message: 'This account is already registered. Please login instead.',
    });
  }
  return true;
};

const validatePassword = password =>
  typeof password === 'string' &&
  password.length >= 8 &&
  password.length <= 72 &&
  Buffer.byteLength(password, 'utf8') <= 72 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

export default function createAuthRouter({ googleClient, googleClientIds, jwtSecret }) {
  const router = Router();
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
  });
  const availabilityRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many availability checks. Please try again later.' },
  });

  router.get('/auth/availability', availabilityRateLimit, async (req, res) => {
    const hasUsername = typeof req.query.username === 'string';
    const hasPhone = typeof req.query.phone === 'string';
    const username = hasUsername
      ? normalizeUsername(req.query.username)
      : null;
    const phone = hasPhone ? normalizePhone(req.query.phone) : null;

    if (!hasUsername && !hasPhone) {
      return res.status(400).json({
        message: 'Provide a username or phone number to check.',
      });
    }
    if (hasUsername && !USERNAME_PATTERN.test(username)) {
      return res.status(400).json({ message: 'Enter a valid username.' });
    }
    if (hasPhone && !PHONE_PATTERN.test(phone)) {
      return res
        .status(400)
        .json({ message: 'Enter a valid 10-digit mobile number.' });
    }

    const { rows } = await pool.query(
      `SELECT
         EXISTS (
           SELECT 1 FROM customers
           WHERE lower(username) = COALESCE($1, '')
         ) AS username_taken,
         EXISTS (
           SELECT 1 FROM customers WHERE phone = COALESCE($2, '')
         ) AS phone_taken`,
      [username, phone],
    );
    return res.json({
      ...(hasUsername
        ? { usernameAvailable: !rows[0].username_taken }
        : {}),
      ...(hasPhone ? { phoneAvailable: !rows[0].phone_taken } : {}),
    });
  });

  router.post('/auth/register', authRateLimit, async (req, res) => {
    const { name, username, phone, password } = req.body ?? {};
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedUsername = normalizeUsername(username);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedName.length < 1 || normalizedName.length > 80) {
      return res
        .status(400)
        .json({ message: 'Name must be between 1 and 80 characters.' });
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      return res.status(400).json({
        message:
          'Username must be 3-30 letters, numbers, dots, underscores or hyphens.',
      });
    }
    if (!PHONE_PATTERN.test(normalizedPhone)) {
      return res
        .status(400)
        .json({ message: 'Enter a valid 10-digit mobile number.' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          'Password must be 8-72 characters and contain at least one letter and one number.',
      });
    }

    try {
      const { rows: existing } = await pool.query(
        `SELECT username, phone
         FROM customers
         WHERE lower(username) = $1 OR phone = $2
         LIMIT 2`,
        [normalizedUsername, normalizedPhone],
      );
      if (existing.some(customer => customer.username?.toLowerCase() === normalizedUsername)) {
        return res.status(409).json({
          code: 'USERNAME_TAKEN',
          message: 'Username already taken. Please choose another username.',
        });
      }
      if (existing.some(customer => customer.phone === normalizedPhone)) {
        return res.status(409).json({
          code: 'PHONE_TAKEN',
          message:
            'You already have an account with this mobile number. Please login instead.',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(
        `INSERT INTO customers
           (name, username, phone, password_hash, auth_provider)
         VALUES ($1, $2, $3, $4, 'password')
         RETURNING id, name, username, phone, email, role,
                   account_status, auth_provider`,
        [normalizedName, normalizedUsername, normalizedPhone, passwordHash],
      );
      return res.status(201).json(createAuthResponse(rows[0], jwtSecret));
    } catch (error) {
      if (duplicateErrorResponse(error, res)) return;
      throw error;
    }
  });

  router.post('/auth/login', authRateLimit, async (req, res) => {
    const { identifier, password } = req.body ?? {};
    const normalizedIdentifier =
      typeof identifier === 'string' ? identifier.trim() : '';

    if (
      !normalizedIdentifier ||
      typeof password !== 'string' ||
      password.length < 1 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res
        .status(400)
        .json({ message: 'Enter your username or phone number and password.' });
    }

    const normalizedPhone = normalizePhone(normalizedIdentifier);
    const { rows } = await pool.query(
      `SELECT id, name, username, phone, email, password_hash, role,
              account_status, auth_provider
       FROM customers
       WHERE lower(username) = $1 OR phone = $2
       LIMIT 2`,
      [normalizedIdentifier.toLowerCase(), normalizedPhone],
    );
    let customer;
    for (const candidate of rows) {
      if (
        candidate.password_hash &&
        (await bcrypt.compare(password, candidate.password_hash))
      ) {
        customer = candidate;
        break;
      }
    }
    if (!customer) {
      return res
        .status(401)
        .json({ message: 'Invalid username/phone number or password.' });
    }
    if (customer.account_status !== 'active') {
      return res.status(403).json({
        code: 'ACCOUNT_BLOCKED',
        message: 'This account is inactive. Contact APNA MART support.',
      });
    }

    return res.json(createAuthResponse(customer, jwtSecret));
  });

  router.post('/auth/google', authRateLimit, async (req, res) => {
    if (!googleClient || !googleClientIds.length) {
      return res.status(503).json({
        code: 'GOOGLE_SIGN_IN_NOT_CONFIGURED',
        message: 'Google sign-in is not configured for this application.',
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
        audience: googleClientIds,
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

    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedPhone =
      req.body.phone === undefined ? null : normalizePhone(req.body.phone);
    if (normalizedPhone !== null && !PHONE_PATTERN.test(normalizedPhone)) {
      return res
        .status(400)
        .json({ message: 'Enter a valid 10-digit mobile number.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let { rows } = await client.query(
        `SELECT id, name, username, phone, email, google_id, password_hash,
                role, account_status, auth_provider
         FROM customers
         WHERE google_id = $1
         FOR UPDATE`,
        [payload.sub],
      );
      let customer = rows[0];

      if (!customer) {
        ({ rows } = await client.query(
          `SELECT id, name, username, phone, email, google_id, password_hash,
                  role, account_status, auth_provider
           FROM customers
           WHERE lower(email) = $1
           FOR UPDATE`,
          [normalizedEmail],
        ));
        customer = rows[0];
      }

      if (customer?.account_status && customer.account_status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          code: 'ACCOUNT_BLOCKED',
          message: 'This account is inactive. Contact APNA MART support.',
        });
      }
      if (customer?.google_id && customer.google_id !== payload.sub) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          code: 'GOOGLE_ACCOUNT_CONFLICT',
          message:
            'This email is already linked to a different Google account. Please login with your existing method.',
        });
      }
      if (!customer?.phone && !normalizedPhone) {
        await client.query('COMMIT');
        return res.json({
          requiresPhone: true,
          profile: {
            name: customer?.name || payload.name || normalizedEmail,
            email: normalizedEmail,
          },
        });
      }

      if (customer) {
        if (!customer.phone && normalizedPhone) {
          const { rows: phoneRows } = await client.query(
            'SELECT id FROM customers WHERE phone = $1 AND id <> $2 LIMIT 1',
            [normalizedPhone, customer.id],
          );
          if (phoneRows[0]) {
            await client.query('ROLLBACK');
            return res.status(409).json({
              code: 'PHONE_TAKEN',
              message:
                'You already have an account with this mobile number. Please login instead.',
            });
          }
        }
        const { rows: updated } = await client.query(
          `UPDATE customers
           SET google_id = $1,
               email = $2,
               phone = COALESCE(phone, $3),
               auth_provider = CASE
                 WHEN password_hash IS NULL THEN 'google'
                 ELSE 'mixed'
               END,
               updated_at = now()
           WHERE id = $4
           RETURNING id, name, username, phone, email, role,
                     account_status, auth_provider`,
          [payload.sub, normalizedEmail, normalizedPhone, customer.id],
        );
        customer = updated[0];
      } else {
        const { rows: phoneRows } = await client.query(
          'SELECT id FROM customers WHERE phone = $1 LIMIT 1',
          [normalizedPhone],
        );
        if (phoneRows[0]) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            code: 'PHONE_TAKEN',
            message:
              'You already have an account with this mobile number. Please login instead.',
          });
        }
        const { rows: created } = await client.query(
          `INSERT INTO customers
             (name, phone, email, google_id, auth_provider)
           VALUES ($1, $2, $3, $4, 'google')
           RETURNING id, name, username, phone, email, role,
                     account_status, auth_provider`,
          [
            String(payload.name || normalizedEmail).slice(0, 80),
            normalizedPhone,
            normalizedEmail,
            payload.sub,
          ],
        );
        customer = created[0];
      }

      await client.query('COMMIT');
      return res.json(createAuthResponse(customer, jwtSecret));
    } catch (error) {
      await client.query('ROLLBACK');
      if (duplicateErrorResponse(error, res)) return;
      throw error;
    } finally {
      client.release();
    }
  });

  router.get('/auth/me', authenticateCustomer, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, name, username, phone, email, role, account_status,
              auth_provider
       FROM customers
       WHERE id = $1
       LIMIT 1`,
      [req.customerId],
    );
    if (!rows[0]) {
      return res.status(401).json({
        code: 'AUTH_INVALID',
        message: 'Your account could not be verified. Please sign in again.',
      });
    }
    return res.json({ user: publicCustomer(rows[0]) });
  });

  return router;
}
