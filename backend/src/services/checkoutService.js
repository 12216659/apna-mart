import { createHash } from 'node:crypto';
import { pool } from '../config/database.js';

export class CheckoutError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const fail = (status, code, message, details) => {
  throw new CheckoutError(status, code, message, details);
};

const toCents = value => Math.round(Number(value) * 100);
const fromCents = value => Number((value / 100).toFixed(2));
const validId = value => typeof value === 'string' && /^\d+$/.test(value);
const distanceInMeters = (lat1, lon1, lat2, lon2) => {
  const radians = value => (value * Math.PI) / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const value = Math.min(
    1,
    Math.max(
    0,
    Math.sin(deltaLat / 2) ** 2 +
      Math.cos(radians(lat1)) *
        Math.cos(radians(lat2)) *
        Math.sin(deltaLon / 2) ** 2,
    ),
  );
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

function normalizeItems(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    fail(400, 'CART_INVALID', 'Your cart is empty or too large to check out.');
  }

  const seen = new Set();
  return value.map(item => {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const quantity = Number(item?.quantity);
    if (
      !name ||
      name.length > 160 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99 ||
      seen.has(name)
    ) {
      fail(400, 'CART_INVALID', 'One or more cart items are invalid.');
    }
    seen.add(name);
    return {
      name,
      quantity,
      clientPrice:
        item.unitPrice === undefined ? null : Number(item.unitPrice),
    };
  });
}

function validateAddressFields(input) {
  const fields = [
    ['name', 80],
    ['houseNumber', 120],
    ['street', 160],
    ['city', 100],
    ['state', 100],
  ];
  const address = {};
  for (const [field, maxLength] of fields) {
    const value =
      typeof input?.[field] === 'string' ? input[field].trim() : '';
    if (!value || value.length > maxLength) {
      fail(400, 'ADDRESS_INVALID', `Enter a valid ${field} (up to ${maxLength} characters).`);
    }
    address[field] = value;
  }

  const phone = typeof input?.phone === 'string' ? input.phone.trim() : '';
  const pinCode = typeof input?.pinCode === 'string' ? input.pinCode.trim() : '';
  const latitude = Number(input?.latitude);
  const longitude = Number(input?.longitude);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    fail(400, 'ADDRESS_INVALID', 'Enter a valid 10-digit mobile number.');
  }
  if (!/^\d{6}$/.test(pinCode)) {
    fail(400, 'ADDRESS_INVALID', 'Enter a valid 6-digit PIN code.');
  }
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    fail(
      400,
      'ADDRESS_LOCATION_REQUIRED',
      'Use your current location to check delivery availability.',
    );
  }

  return { ...address, phone, pinCode, latitude, longitude };
}

async function getStore(queryable, storeId, lock) {
  if (!validId(String(storeId ?? ''))) {
    fail(400, 'STORE_INVALID', 'Select a valid store before checking out.');
  }

  const lockClause = lock ? 'FOR UPDATE' : '';
  const { rows } = await queryable.query(
    `SELECT
      id, name, address, city, latitude, longitude,
      delivery_available, pickup_available, is_open, is_active, is_approved,
      delivery_fee, pickup_fee, handling_fee, tax_rate,
      service_radius_meters, delivery_time_min, delivery_time_max,
      pickup_preparation_minutes
     FROM stores
     WHERE id = $1
     ${lockClause}`,
    [String(storeId)],
  );
  const store = rows[0];
  if (!store || !store.is_active || !store.is_approved || !store.is_open) {
    fail(
      409,
      'STORE_INACTIVE',
      'This store is not currently accepting orders. Choose another store.',
    );
  }
  return store;
}

async function getCoupon(queryable, code, storeId, lock) {
  if (!code) return null;
  const lockClause = lock ? 'FOR UPDATE' : '';
  const { rows } = await queryable.query(
    `SELECT id, code, description, discount_type, discount_value,
            minimum_order, maximum_discount, usage_limit, used_count
     FROM coupons
     WHERE upper(code) = upper($1)
       AND is_active = true
       AND starts_at <= now()
       AND (expires_at IS NULL OR expires_at > now())
       AND (store_id IS NULL OR store_id = $2)
       AND (usage_limit IS NULL OR used_count < usage_limit)
     ${lockClause}`,
    [code, storeId],
  );
  if (!rows[0]) {
    fail(422, 'INVALID_COUPON', 'This coupon is invalid or no longer available.');
  }
  return rows[0];
}

async function buildQuote(queryable, customerId, input, options = {}) {
  const store = await getStore(queryable, input.storeId, options.lock);
  const fulfilmentMethod = input.fulfilmentMethod;
  if (!['delivery', 'pickup'].includes(fulfilmentMethod)) {
    fail(400, 'FULFILMENT_INVALID', 'Choose home delivery or store pickup.');
  }
  if (
    fulfilmentMethod === 'delivery' &&
    !store.delivery_available
  ) {
    fail(
      409,
      'DELIVERY_UNAVAILABLE',
      'Home delivery is not available from this store.',
    );
  }
  if (fulfilmentMethod === 'pickup' && !store.pickup_available) {
    fail(
      409,
      'PICKUP_UNAVAILABLE',
      'Store pickup is not available from this store.',
    );
  }
  if (input.paymentMethod !== 'cash_on_delivery') {
    fail(
      422,
      'PAYMENT_METHOD_UNAVAILABLE',
      'Cash on Delivery is the only payment method currently available.',
      { availablePaymentMethods: ['cash_on_delivery'] },
    );
  }

  let address = null;
  if (fulfilmentMethod === 'delivery') {
    if (!validId(String(input.addressId ?? ''))) {
      fail(422, 'ADDRESS_REQUIRED', 'Add or select a delivery address.');
    }
    const lockClause = options.lock ? 'FOR SHARE' : '';
    const { rows } = await queryable.query(
      `SELECT id, name, phone, house_number, street, city, state, pin_code,
              latitude, longitude
       FROM customer_addresses
       WHERE id = $1 AND customer_id = $2
       ${lockClause}`,
      [String(input.addressId), customerId],
    );
    address = rows[0];
    if (!address) {
      fail(422, 'ADDRESS_REQUIRED', 'Select one of your saved delivery addresses.');
    }
    const distance = distanceInMeters(
      Number(address.latitude),
      Number(address.longitude),
      Number(store.latitude),
      Number(store.longitude),
    );
    if (distance > Number(store.service_radius_meters)) {
      fail(
        422,
        'DELIVERY_UNAVAILABLE',
        `This address is outside the store's ${store.service_radius_meters}-metre delivery area.`,
        { distanceMeters: Math.round(distance) },
      );
    }
  } else if (!store.address) {
    fail(
      409,
      'PICKUP_UNAVAILABLE',
      'This store does not have a pickup address configured.',
    );
  }

  const requestedItems = normalizeItems(input.items);
  let itemTotalCents = 0;
  let productDiscountCents = 0;
  const items = [];
  for (const requested of requestedItems) {
    const lockClause = options.lock ? 'FOR UPDATE' : '';
    const { rows } = await queryable.query(
      `SELECT id, name, brand, size, price, original_price, stock, image_url
       FROM products
       WHERE store_id = $1 AND name = $2 AND is_active = true
       ${lockClause}`,
      [String(store.id), requested.name],
    );
    const product = rows[0];
    if (!product) {
      fail(
        409,
        'PRODUCT_UNAVAILABLE',
        `${requested.name} is no longer available from this store.`,
        { productName: requested.name },
      );
    }
    if (Number(product.stock) < requested.quantity) {
      fail(
        409,
        'OUT_OF_STOCK',
        `Only ${product.stock} ${product.name} item(s) are currently available.`,
        { productName: product.name, availableStock: Number(product.stock) },
      );
    }

    const unitPriceCents = toCents(product.price);
    const clientPriceCents =
      requested.clientPrice === null ? null : toCents(requested.clientPrice);
    const priceChanged =
      clientPriceCents !== null && clientPriceCents !== unitPriceCents;
    if (priceChanged && options.rejectPriceChanges) {
      fail(
        409,
        'PRICE_CHANGED',
        `The price of ${product.name} changed. Review the updated total and try again.`,
        { productName: product.name, currentPrice: fromCents(unitPriceCents) },
      );
    }

    const originalPriceCents =
      product.original_price === null
        ? unitPriceCents
        : toCents(product.original_price);
    const discountCents =
      Math.max(0, originalPriceCents - unitPriceCents) * requested.quantity;
    const lineTotalCents =
      unitPriceCents * requested.quantity - discountCents;
    itemTotalCents += unitPriceCents * requested.quantity;
    productDiscountCents += discountCents;
    items.push({
      id: String(product.id),
      name: product.name,
      brand: product.brand,
      size: product.size,
      image: product.image_url,
      quantity: requested.quantity,
      unitPrice: fromCents(unitPriceCents),
      lineTotal: fromCents(lineTotalCents),
      productDiscount: fromCents(discountCents),
      priceChanged,
    });
  }

  const taxableTotalCents = Math.max(
    0,
    itemTotalCents - productDiscountCents,
  );
  const deliveryFeeCents =
    fulfilmentMethod === 'delivery' ? toCents(store.delivery_fee) : 0;
  const pickupFeeCents =
    fulfilmentMethod === 'pickup' ? toCents(store.pickup_fee) : 0;
  const handlingFeeCents = toCents(store.handling_fee);
  const taxesCents = Math.round(
    taxableTotalCents * (Number(store.tax_rate) / 100),
  );
  const coupon = await getCoupon(
    queryable,
    typeof input.couponCode === 'string' ? input.couponCode.trim() : '',
    store.id,
    options.lock,
  );
  let couponDiscountCents = 0;
  if (coupon) {
    if (taxableTotalCents < toCents(coupon.minimum_order)) {
      fail(
        422,
        'INVALID_COUPON',
        `This coupon requires a minimum item total of ₹${coupon.minimum_order}.`,
        { couponCode: coupon.code, minimumOrder: Number(coupon.minimum_order) },
      );
    }
    couponDiscountCents =
      coupon.discount_type === 'percentage'
        ? Math.round(
            (taxableTotalCents * Number(coupon.discount_value)) / 100,
          )
        : toCents(coupon.discount_value);
    if (coupon.maximum_discount !== null) {
      couponDiscountCents = Math.min(
        couponDiscountCents,
        toCents(coupon.maximum_discount),
      );
    }
    couponDiscountCents = Math.min(couponDiscountCents, taxableTotalCents);
  }

  const grandTotalCents = Math.max(
    0,
    itemTotalCents -
      productDiscountCents +
      deliveryFeeCents +
      pickupFeeCents +
      handlingFeeCents +
      taxesCents -
      couponDiscountCents,
  );
  const estimatedTimeMin =
    fulfilmentMethod === 'delivery'
      ? Number(store.delivery_time_min)
      : Number(store.pickup_preparation_minutes);
  const estimatedTimeMax =
    fulfilmentMethod === 'delivery'
      ? Number(store.delivery_time_max)
      : Number(store.pickup_preparation_minutes);

  return {
    store: {
      id: String(store.id),
      name: store.name,
      address: store.address,
      city: store.city,
    },
    address,
    fulfilmentMethod,
    paymentMethod: 'cash_on_delivery',
    items,
    itemTotal: fromCents(itemTotalCents),
    productDiscount: fromCents(productDiscountCents),
    deliveryFee: fromCents(deliveryFeeCents),
    pickupFee: fromCents(pickupFeeCents),
    handlingFee: fromCents(handlingFeeCents),
    taxes: fromCents(taxesCents),
    coupon: coupon
      ? {
          code: coupon.code,
          description: coupon.description,
          discount: fromCents(couponDiscountCents),
        }
      : null,
    couponDiscount: fromCents(couponDiscountCents),
    grandTotal: fromCents(grandTotalCents),
    paymentMethods: ['cash_on_delivery'],
    estimatedTimeMin,
    estimatedTimeMax,
    storeRecord: store,
  };
}

export async function getCheckoutOptions(storeId) {
  const store = await getStore(pool, storeId, false);
  const { rows: offers } = await pool.query(
    `SELECT code, description, discount_type, discount_value, minimum_order,
            maximum_discount
     FROM coupons
     WHERE is_active = true
       AND starts_at <= now()
       AND (expires_at IS NULL OR expires_at > now())
       AND (store_id IS NULL OR store_id = $1)
       AND (usage_limit IS NULL OR used_count < usage_limit)
     ORDER BY id`,
    [String(store.id)],
  );
  return {
    store: {
      id: String(store.id),
      name: store.name,
      address: store.address,
      city: store.city,
      deliveryAvailable: store.delivery_available,
      pickupAvailable: store.pickup_available,
      deliveryFee: Number(store.delivery_fee),
      pickupFee: Number(store.pickup_fee),
      handlingFee: Number(store.handling_fee),
      deliveryTimeMin: Number(store.delivery_time_min),
      deliveryTimeMax: Number(store.delivery_time_max),
      pickupPreparationMinutes: Number(store.pickup_preparation_minutes),
    },
    paymentMethods: ['cash_on_delivery'],
    offers: offers.map(offer => ({
      code: offer.code,
      description: offer.description,
      discountType: offer.discount_type,
      discountValue: Number(offer.discount_value),
      minimumOrder: Number(offer.minimum_order),
      maximumDiscount:
        offer.maximum_discount === null
          ? null
          : Number(offer.maximum_discount),
    })),
  };
}

export async function listCustomerAddresses(customerId) {
  const { rows } = await pool.query(
    `SELECT id, name, phone, house_number AS "houseNumber",
            street, city, state, pin_code AS "pinCode",
            latitude, longitude
     FROM customer_addresses
     WHERE customer_id = $1
     ORDER BY id DESC`,
    [customerId],
  );
  return rows;
}

export async function createCustomerAddress(customerId, input) {
  const address = validateAddressFields(input);
  const { rows } = await pool.query(
    `INSERT INTO customer_addresses
       (customer_id, name, phone, house_number, street, city, state,
        pin_code, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, name, phone, house_number AS "houseNumber",
               street, city, state, pin_code AS "pinCode",
               latitude, longitude`,
    [
      customerId,
      address.name,
      address.phone,
      address.houseNumber,
      address.street,
      address.city,
      address.state,
      address.pinCode,
      address.latitude,
      address.longitude,
    ],
  );
  return rows[0];
}

export async function createCheckoutQuote(customerId, input) {
  const quote = await buildQuote(pool, customerId, input);
  delete quote.storeRecord;
  return quote;
}

const requestFingerprint = input =>
  createHash('sha256')
    .update(
      JSON.stringify({
        storeId: String(input.storeId),
        fulfilmentMethod: input.fulfilmentMethod,
        addressId: input.addressId ? String(input.addressId) : null,
        paymentMethod: input.paymentMethod,
        couponCode: input.couponCode?.trim().toUpperCase() || null,
        items: normalizeItems(input.items).map(item => ({
          name: item.name,
          quantity: item.quantity,
          clientPrice: item.clientPrice,
        })),
      }),
    )
    .digest('hex');

async function loadOrder(queryable, customerId, orderId) {
  const { rows } = await queryable.query(
    `SELECT id, fulfilment_method, payment_method, payment_status,
            order_status, item_total, product_discount, delivery_fee,
            handling_fee, taxes, coupon_code, coupon_discount, grand_total,
            address_snapshot, store_snapshot, estimated_time_min,
            estimated_time_max, created_at
     FROM orders
     WHERE id = $1 AND customer_id = $2`,
    [String(orderId), customerId],
  );
  const order = rows[0];
  if (!order) {
    fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }
  const { rows: items } = await queryable.query(
    `SELECT product_name AS name, brand, size, image_url AS image,
            quantity, unit_price AS "unitPrice", line_total AS "lineTotal"
     FROM order_items
     WHERE order_id = $1
     ORDER BY id`,
    [String(order.id)],
  );
  return {
    id: String(order.id),
    orderId: `AM-${order.id}`,
    fulfilmentMethod: order.fulfilment_method,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: order.order_status,
    itemTotal: Number(order.item_total),
    productDiscount: Number(order.product_discount),
    deliveryFee: Number(order.delivery_fee),
    handlingFee: Number(order.handling_fee),
    taxes: Number(order.taxes),
    couponCode: order.coupon_code,
    couponDiscount: Number(order.coupon_discount),
    grandTotal: Number(order.grand_total),
    address: order.address_snapshot,
    store: order.store_snapshot,
    estimatedTimeMin: order.estimated_time_min,
    estimatedTimeMax: order.estimated_time_max,
    createdAt: order.created_at,
    items: items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}

export async function createCustomerOrder(customerId, input, idempotencyKey) {
  if (
    typeof idempotencyKey !== 'string' ||
    !/^[a-zA-Z0-9._-]{16,100}$/.test(idempotencyKey)
  ) {
    fail(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid order request key is required.');
  }
  const fingerprint = requestFingerprint(input);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${customerId}:${idempotencyKey}`,
    ]);
    const { rows: existingRows } = await client.query(
      `SELECT id, request_hash
       FROM orders
       WHERE customer_id = $1 AND idempotency_key = $2
       LIMIT 1`,
      [customerId, idempotencyKey],
    );
    if (existingRows[0]) {
      if (existingRows[0].request_hash !== fingerprint) {
        fail(
          409,
          'IDEMPOTENCY_CONFLICT',
          'This order request key was already used for a different cart.',
        );
      }
      const order = await loadOrder(
        client,
        customerId,
        existingRows[0].id,
      );
      await client.query('COMMIT');
      return { order, duplicate: true };
    }

    const quote = await buildQuote(client, customerId, input, {
      lock: true,
      rejectPriceChanges: true,
    });
    for (const item of quote.items) {
      const { rowCount } = await client.query(
        `UPDATE products
         SET stock = stock - $1, updated_at = now()
         WHERE id = $2 AND stock >= $1`,
        [item.quantity, item.id],
      );
      if (rowCount !== 1) {
        fail(
          409,
          'OUT_OF_STOCK',
          `${item.name} is no longer available in the requested quantity.`,
          { productName: item.name },
        );
      }
    }

    const addressSnapshot = quote.address
      ? {
          name: quote.address.name,
          phone: quote.address.phone,
          houseNumber: quote.address.house_number,
          street: quote.address.street,
          city: quote.address.city,
          state: quote.address.state,
          pinCode: quote.address.pin_code,
        }
      : null;
    const storeSnapshot = {
      id: quote.store.id,
      name: quote.store.name,
      address: quote.store.address,
      city: quote.store.city,
    };
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
         customer_id, store_id, address_id, idempotency_key, request_hash,
         fulfilment_method, payment_method, payment_status, order_status,
         item_total, product_discount, delivery_fee, handling_fee, taxes,
         coupon_code, coupon_discount, grand_total, address_snapshot,
         store_snapshot, estimated_time_min, estimated_time_max
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, 'pending', 'placed',
         $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
       )
       RETURNING id`,
      [
        customerId,
        quote.store.id,
        input.addressId || null,
        idempotencyKey,
        fingerprint,
        quote.fulfilmentMethod,
        quote.paymentMethod,
        quote.itemTotal,
        quote.productDiscount,
        quote.deliveryFee,
        quote.handlingFee,
        quote.taxes,
        quote.coupon?.code || null,
        quote.couponDiscount,
        quote.grandTotal,
        addressSnapshot,
        storeSnapshot,
        quote.estimatedTimeMin,
        quote.estimatedTimeMax,
      ],
    );
    const orderId = orderRows[0].id;

    for (const item of quote.items) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, product_name, brand, size, image_url,
           quantity, unit_price, product_discount, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          orderId,
          item.id,
          item.name,
          item.brand,
          item.size,
          item.image,
          item.quantity,
          item.unitPrice,
          item.productDiscount,
          item.lineTotal,
        ],
      );
    }
    if (quote.coupon) {
      await client.query(
        'UPDATE coupons SET used_count = used_count + 1 WHERE upper(code) = upper($1)',
        [quote.coupon.code],
      );
    }

    const order = await loadOrder(client, customerId, orderId);
    await client.query('COMMIT');
    return { order, duplicate: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getCustomerOrder(customerId, orderId) {
  if (!validId(String(orderId ?? ''))) {
    fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }
  return loadOrder(pool, customerId, orderId);
}
