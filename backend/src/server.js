import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import morgan from 'morgan';
import { OAuth2Client } from 'google-auth-library';
import { pool } from './config/database.js';
import createAuthRouter from './routes/authRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const app = express();
const port = Number(process.env.PORT) || 5000;
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'https://app.apnamart.example.com')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const googleClientIds = [
  process.env.GOOGLE_CLIENT_ID,
  ...(process.env.GOOGLE_CLIENT_IDS || '').split(','),
]
  .map(value => value?.trim())
  .filter(Boolean);
const googleClient = googleClientIds.length
  ? new OAuth2Client(googleClientIds[0])
  : null;
const authRoutes = createAuthRouter({
  googleClient,
  googleClientIds,
  jwtSecret,
});

app.set('trust proxy', 1);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const isHttps = req.secure || forwardedProto === 'https';

  if (!isHttps) {
    return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
  }

  return next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS policy rejected this origin.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', authRoutes);
app.use('/api', checkoutRoutes);

const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371000;
  const toRadians = value => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
});

app.get('/api/stores', async (req, res) => {
  const latitude = Number(req.query.latitude ?? 17.4474);
  const longitude = Number(req.query.longitude ?? 78.3892);
  const limit = Number(req.query.limit ?? 20);
  const withinMeters = Number(req.query.within ?? 500);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'nearest';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
  }

  const baseQuery = `
    SELECT
      id,
      name,
      category,
      image_url AS image,
      logo_text AS logo,
      address,
      city,
      latitude AS lat,
      longitude AS lon,
      rating,
      reviews_count AS reviews,
      delivery_time_min,
      delivery_time_max,
      delivery_fee,
      pickup_available,
      delivery_available,
      is_open,
      products_count,
      (6371000 * acos(
        cos(radians($1)) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) *
        sin(radians(latitude))
      )) AS distance_meters
    FROM stores
    WHERE 1 = 1
  `;

  const params = [latitude, longitude];
  let index = 2;

  if (category) {
    params.push(category);
    index += 1;
    baseQuery += ` AND category = $${index}`;
  }

  if (search) {
    params.push(`%${search}%`);
    index += 1;
    baseQuery += ` AND (LOWER(name) LIKE LOWER($${index}) OR LOWER(category) LIKE LOWER($${index}))`;
  }

  baseQuery += ` AND (6371000 * acos(
    cos(radians($1)) *
    cos(radians(latitude)) *
    cos(radians(longitude) - radians($2)) +
    sin(radians($1)) *
    sin(radians(latitude))
  )) <= $${index + 1}`;
  params.push(withinMeters);

  let query = `${baseQuery} ORDER BY distance_meters ASC`;
  if (sort === 'rating') {
    query = `${baseQuery} ORDER BY rating DESC, distance_meters ASC`;
  }
  if (sort === 'fastest') {
    query = `${baseQuery} ORDER BY delivery_time_min ASC, distance_meters ASC`;
  }

  const { rows } = await pool.query(`${query} LIMIT ${Math.max(1, Number(limit) || 20)}` , params);
  const stores = rows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image,
    logo: row.logo || row.name.slice(0, 2).toUpperCase(),
    address: row.address,
    city: row.city,
    distance: Math.round(Number(row.distance_meters) || 0),
    lat: Number(row.lat),
    lon: Number(row.lon),
    rating: Number(row.rating),
    reviews: Number(row.reviews || 0),
    deliveryTime: `${row.delivery_time_min}-${row.delivery_time_max} min`,
    deliveryAvailable: row.delivery_available,
    pickupAvailable: row.pickup_available,
    isOpen: row.is_open,
    productCount: Number(row.products_count || 0),
    deliveryFee: Number(row.delivery_fee || 0),
  }));

  return res.json({ stores, total: stores.length });
});

app.get('/api/stores/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT
      id,
      name,
      category,
      image_url AS image,
      logo_text AS logo,
      address,
      city,
      latitude AS lat,
      longitude AS lon,
      rating,
      reviews_count AS reviews,
      delivery_time_min,
      delivery_time_max,
      delivery_fee,
      pickup_available,
      delivery_available,
      is_open,
      products_count
     FROM stores
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  if (!rows[0]) {
    return res.status(404).json({ message: 'Store not found.' });
  }

  const store = rows[0];
  return res.json({
    ...store,
    image: store.image,
    logo: store.logo || store.name.slice(0, 2).toUpperCase(),
    distance: 0,
    deliveryTime: `${store.delivery_time_min}-${store.delivery_time_max} min`,
  });
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
