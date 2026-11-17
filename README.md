# Apna Mart

Apna Mart is a JavaScript app built with React Native and Expo. Its Node.js/Express API uses PostgreSQL for customer accounts. The mobile app uses Expo Location for foreground GPS and `react-native-maps` for maps.

## Source layout

- `App.js` is the Expo entry point; `src/navigation/AppNavigator.js` coordinates screens and app navigation.
- `src/screens/` contains auth, home, product, store, cart, address, orders, and profile screens.
- `src/components/` contains reusable buttons, headers, search bars, and product/store cards.
- `src/services/` contains API, authentication, store, product, checkout, and payment integration operations.
- `src/constants/appData.js` holds sample catalog data; `src/theme/` contains colors and React Native styles.
- `src/assets/` contains app images.

## Requirements

- Node.js 22.11 or newer and npm
- Android Studio, Android SDK, JDK 17, and an Android emulator or device for Android development
- macOS and Xcode for iOS native builds (Expo Go can be used for basic testing)
- A local or hosted PostgreSQL database
- A Google Maps API key for the Android map; configure Maps SDK for Android in Google Cloud

## Configure the app

Copy `.env.example` to `.env`. Set `EXPO_PUBLIC_API_URL` to the backend URL reachable from the device. For a physical phone, use your computer's LAN IP and make sure both devices share a network. The app defaults to the Android emulator and iOS simulator addresses.

Set `GOOGLE_MAPS_ANDROID_API_KEY` in `.env` to enable the Android map. Optionally set `GOOGLE_MAPS_IOS_API_KEY` to use Google Maps on iOS; without it, iOS uses Apple Maps. Restrict keys to the relevant app identifiers and APIs.

If the Android key is missing, the Stores screen shows a setup notice instead of opening Google Maps, and the store list remains available.

Development builds allow local HTTP requests to reach the Node API. Use HTTPS for deployed APIs and set `NODE_ENV=production` when generating a production native build.

## Set up the backend

Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL` to your PostgreSQL connection string and `JWT_SECRET` to a private random secret of at least 32 characters. Set `DATABASE_SSL=true` if your database provider requires SSL. The backend exposes a nearby-store discovery endpoint at `/api/stores`, with the 500-metre radius enforced on the server.

Generate a secret in PowerShell with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Install dependencies, create the customer table, and start the API:

```powershell
cd backend
npm install
npm run db:migrate
npm run dev
```

Leave the backend running while using the app. Existing customer data in MongoDB is not copied automatically; export and migrate it separately if you need to keep it.

## Run the mobile app

From the project root:

```powershell
npm install
npm start
```

In another terminal, build and launch the Android development app:

```powershell
npm run android
```

On macOS, use `npm run ios` to build for the iOS simulator. After changing Expo config plugins, sync the native project for the platform you are building: run `npx expo prebuild --platform android` on Windows or `npx expo prebuild --platform ios` on macOS. iOS native builds require macOS and Xcode.

Location permission is requested only when the user chooses **Use my current location** on the Stores screen. The displayed sample stores do not include real coordinates, so the map shows the user's location but does not invent store pins. Add real store latitude/longitude data to display store markers.

## Authentication

The app's authentication screens use the shared `src/screens/auth/AuthForm.js` UI and `src/services/authService.js` API layer. The backend implements:

| Route | Purpose |
| --- | --- |
| `POST /api/auth/register` | Register with name, username, phone and password. |
| `POST /api/auth/login` | Sign in with username or phone and password. |
| `GET /api/auth/availability?username=...` / `?phone=...` | Check username or phone availability. |
| `POST /api/auth/google` | Verify a Google ID token, link an existing account or create an account after collecting a phone number. |
| `GET /api/auth/me` | Return the authenticated customer's current profile. |

The server validates credentials and uniqueness, hashes passwords with bcrypt, verifies Google ID tokens itself, and issues seven-day JWTs. Availability checks are advisory; registration and database uniqueness constraints are authoritative. Authenticated routes reject blocked accounts.

For Google sign-in, create OAuth client IDs for the web app and each native platform. Put the client IDs in the matching `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` entries in the project `.env`. On the backend, set `GOOGLE_CLIENT_ID` to the web client ID and `GOOGLE_CLIENT_IDS` to a comma-separated list of every client ID accepted by the server. These client IDs are public identifiers, not secrets; never put a Google client secret in the mobile app. The button remains disabled until its platform ID is configured. Google sign-in is not ready until real client IDs and the provider's redirect/application configuration are set up.

Tokens are stored using Expo SecureStore. On first startup after this update, an existing AsyncStorage session is migrated to SecureStore and removed from the legacy location. The `customers` schema migration also allows Google-only accounts without a username or password hash; review existing customer data for case-insensitive username/email or duplicate phone conflicts before running `npm run db:migrate`. Authentication routes, database migration, Google OAuth, and token persistence have not been tested end-to-end against a configured PostgreSQL database or OAuth project.

## Checkout integration status

The checkout UI calls `src/services/checkoutService.js`; it does not make network requests directly. The checkout service uses the existing `src/services/api.js` configuration and bearer-token convention. The following backend routes are implemented in this repository:

| Frontend service function | Existing backend route | Responsibility |
| --- | --- | --- |
| `getCheckoutSummary()` | `POST /api/checkout/quote` | Get a server-calculated quote. |
| `validateCheckout()` | `POST /api/checkout/quote` | Revalidate store, products, prices, stock, fulfilment, coupon, and total. |
| `validateAddress()` | `POST /api/checkout/quote` | The quote route validates delivery address ownership and service radius; there is no separate address-validation route. |
| `getAvailablePaymentMethods()` | `GET /api/checkout/options?storeId=...` | Reads supported methods from the options response; it does not call a separate payment-method endpoint. |
| `applyCoupon()` / `removeCoupon()` | `POST /api/checkout/quote` | Requotes with or without a coupon; coupon validity and discounts are server-checked. |
| `createOrder()` | `POST /api/orders` | Creates the order with an idempotency key and server-side validation. |
| `getOrderDetails()` | `GET /api/orders/:id` | Reads the authenticated customer's order. |
| `getSavedAddresses()` / `createSavedAddress()` | `GET` / `POST /api/addresses` | Reads or adds authenticated customer addresses. |

These are existing routes, not proposed endpoint names. `getCheckoutSummary`, validation, and coupon functions intentionally share the quote endpoint because the backend currently exposes one authoritative quote/validation operation. Coupon removal is a fresh quote without a coupon; there is no separate remove-coupon route.

The payload adapter `buildCheckoutPayload()` maps the existing in-memory cart to the current API contract: `storeId`, items with `name`, `quantity`, and comparison `unitPrice`, lowercase `fulfilmentMethod` (`delivery` or `pickup`), optional delivery `addressId`, `paymentMethod`, and optional `couponCode`. It forwards an item `id`/`productId` when a future catalog supplies one, but current cart products do not have backend product IDs and the existing order API currently looks up products by exact name within the selected store. The authenticated customer ID is derived by the backend from the bearer token and is deliberately not trusted from the request body. Totals are returned by the backend quote and are not submitted as authoritative amounts.

The only payment method currently returned by the backend is Cash on Delivery. The order API records its payment as pending; the app does not collect payment or mark it paid. `src/services/paymentService.js` is the gateway integration boundary: online methods stay unavailable, and payment initiation/status checks explicitly fail as not configured until real gateway-backed backend APIs are added. The checkout flow is wired to initiate an online payment and then reload the backend order when such a method is enabled. No card details are collected or stored.

Checkout does not use mock quotes, discounts, payment results, or successful orders. The wider product catalogue in `src/constants/appData.js` is illustrative; populate the backend `products` table with real store-specific products before placing orders. The checkout schema migration must also be applied to the configured PostgreSQL database. The Android app bundle has been verified, but a database-backed end-to-end order has not been run, so runtime/backend connectivity is not claimed as tested.

When adding payment gateway support, implement the real payment endpoints and update `src/services/paymentService.js` and the response mapping; keep the screen independent of gateway-specific details.
