import { requestJson } from './api';

const authenticatedOptions = (token, options = {}) => ({
  ...options,
  headers: {
    Authorization: `Bearer ${token}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  },
});

const requestQuote = (token, checkout) =>
  requestJson(
    '/api/checkout/quote',
    authenticatedOptions(token, {
      method: 'POST',
      body: JSON.stringify(checkout),
    }),
  );

export function buildCheckoutPayload({
  storeId,
  items,
  quotedItems = [],
  fulfilmentMethod,
  addressId,
  paymentMethod,
  couponCode,
}) {
  return {
    storeId,
    items: items.map(item => {
      const productId = item.productId ?? item.id;
      return {
        ...(productId === undefined || productId === null
          ? {}
          : { productId }),
        name: item.name,
        quantity: item.quantity,
        unitPrice:
          quotedItems.find(quotedItem => quotedItem.name === item.name)
            ?.unitPrice ?? item.price,
      };
    }),
    fulfilmentMethod,
    ...(fulfilmentMethod === 'delivery' && addressId ? { addressId } : {}),
    paymentMethod,
    ...(couponCode ? { couponCode } : {}),
  };
}

export function getCheckoutOptions(token, storeId) {
  return requestJson(
    `/api/checkout/options?storeId=${encodeURIComponent(String(storeId))}`,
    authenticatedOptions(token),
  );
}

export function getAvailablePaymentMethods(checkoutOptions) {
  return Array.isArray(checkoutOptions?.paymentMethods)
    ? checkoutOptions.paymentMethods
    : [];
}

export async function getSavedAddresses(token) {
  const result = await requestJson(
    '/api/addresses',
    authenticatedOptions(token),
  );
  return result.addresses;
}

export async function createSavedAddress(token, address) {
  const result = await requestJson(
    '/api/addresses',
    authenticatedOptions(token, {
      method: 'POST',
      body: JSON.stringify(address),
    }),
  );
  return result.address;
}

export function getCheckoutSummary(token, checkout) {
  return requestQuote(token, checkout);
}

export function validateCheckout(token, checkout) {
  return getCheckoutSummary(token, checkout);
}

export function validateAddress(token, checkout) {
  return getCheckoutSummary(token, checkout);
}

export function applyCoupon(token, checkout, couponCode) {
  return getCheckoutSummary(token, { ...checkout, couponCode });
}

export function removeCoupon(token, checkout) {
  const checkoutWithoutCoupon = { ...checkout };
  delete checkoutWithoutCoupon.couponCode;
  return getCheckoutSummary(token, checkoutWithoutCoupon);
}

export async function createOrder(token, checkout, idempotencyKey) {
  const result = await requestJson(
    '/api/orders',
    authenticatedOptions(token, {
      method: 'POST',
      body: JSON.stringify(checkout),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  );
  return result.order;
}

export async function getOrderDetails(token, orderId) {
  const result = await requestJson(
    `/api/orders/${encodeURIComponent(orderId)}`,
    authenticatedOptions(token),
  );
  return result.order;
}
