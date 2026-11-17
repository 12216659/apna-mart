import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export default async function authenticateCustomer(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Sign in to continue.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload.sub !== 'string' || !/^\d+$/.test(payload.sub)) {
      return res.status(401).json({
        code: 'AUTH_INVALID',
        message: 'Your sign-in has expired. Please sign in again.',
      });
    }

    const { rows } = await pool.query(
      'SELECT id, account_status FROM customers WHERE id = $1 LIMIT 1',
      [payload.sub],
    );
    if (!rows[0]) {
      return res.status(401).json({
        code: 'AUTH_INVALID',
        message: 'Your account could not be verified. Please sign in again.',
      });
    }

    if (rows[0].account_status !== 'active') {
      return res.status(403).json({
        code: 'ACCOUNT_BLOCKED',
        message: 'This account is inactive. Contact APNA MART support.',
      });
    }

    req.customerId = payload.sub;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        code: 'AUTH_INVALID',
        message: 'Your sign-in has expired. Please sign in again.',
      });
    }

    return next(error);
  }
}
