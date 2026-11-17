export function isPaymentMethodReady(paymentMethod) {
  return paymentMethod === 'cash_on_delivery';
}

const gatewayPendingError = () => {
  const error = new Error(
    'Online payment is unavailable until a payment gateway and backend verification are configured.',
  );
  error.code = 'PAYMENT_GATEWAY_NOT_CONFIGURED';
  return error;
};

export async function initiatePayment(paymentRequest) {
  if (!paymentRequest?.orderId || !paymentRequest?.paymentMethod) {
    throw new Error('An order ID and payment method are required.');
  }
  throw gatewayPendingError();
}

export async function getPaymentStatus(orderId) {
  if (!orderId) {
    throw new Error('An order ID is required to check payment status.');
  }
  throw gatewayPendingError();
}
