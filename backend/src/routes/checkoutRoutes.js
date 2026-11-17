import { Router } from 'express';
import authenticateCustomer from '../middleware/authenticateCustomer.js';
import {
  CheckoutError,
  createCheckoutQuote,
  createCustomerAddress,
  createCustomerOrder,
  getCheckoutOptions,
  getCustomerOrder,
  listCustomerAddresses,
} from '../services/checkoutService.js';

const router = Router();

const handle = handler => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }
    return next(error);
  }
};

router.use(authenticateCustomer);

router.get(
  '/addresses',
  handle(async (req, res) => {
    res.json({ addresses: await listCustomerAddresses(req.customerId) });
  }),
);

router.post(
  '/addresses',
  handle(async (req, res) => {
    const address = await createCustomerAddress(req.customerId, req.body);
    res.status(201).json({ address });
  }),
);

router.get(
  '/checkout/options',
  handle(async (req, res) => {
    res.json(await getCheckoutOptions(req.query.storeId));
  }),
);

router.post(
  '/checkout/quote',
  handle(async (req, res) => {
    res.json(await createCheckoutQuote(req.customerId, req.body));
  }),
);

router.post(
  '/orders',
  handle(async (req, res) => {
    const { order, duplicate } = await createCustomerOrder(
      req.customerId,
      req.body,
      req.get('idempotency-key'),
    );
    res.status(duplicate ? 200 : 201).json({ order });
  }),
);

router.get(
  '/orders/:id',
  handle(async (req, res) => {
    res.json({ order: await getCustomerOrder(req.customerId, req.params.id) });
  }),
);

export default router;
