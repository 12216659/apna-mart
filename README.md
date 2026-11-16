# Apna Mart

Apna Mart is a React Native and Expo mobile app for Android and iOS. Its existing Node.js/Express backend uses MongoDB for customer accounts.

## Requirements

- Node.js 22.11 or newer and npm
- Android Studio, Android SDK, JDK 17, and an Android emulator or device for Android development
- macOS and Xcode for iOS native builds
- MongoDB connection for the backend
- Google Maps API key for the Android map

## Configure the app

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to a backend URL reachable from the device. For a physical phone, use your computer's LAN IP and make sure both devices share a network. The app defaults to the Android emulator and iOS simulator addresses.

Set `GOOGLE_MAPS_ANDROID_API_KEY` to enable Android maps. Optionally set `GOOGLE_MAPS_IOS_API_KEY` to use Google Maps on iOS; without it, iOS uses Apple Maps. Restrict keys to the relevant app identifiers and APIs.

## Set up the backend

Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` and a private `JWT_SECRET` of at least 32 characters. The optional `MONGODB_DNS_SERVERS` setting can be used if the host cannot resolve MongoDB SRV DNS records.

Generate a secret in PowerShell with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Install dependencies and start the API:

```powershell
cd backend
npm install
npm run dev
```

The preserved backend currently provides customer authentication but does not provide store discovery, inventory, or order/checkout endpoints. The mobile app therefore uses illustrative local store and product data when store discovery is unavailable.

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

Location permission is requested only when the user chooses **Use my current location** on the Stores screen. The illustrative stores have coordinates for map previews.

Sample products and prices remain illustrative. Store pages can display fulfilment availability, charges, and estimates supplied in store data, and the selected fulfilment method is carried in the in-memory cart. The preserved backend has no store or order API, so live store fees and delivery estimates, order placement, and server-side total revalidation are not implemented. Username/password registration and sign-in use MongoDB. Native Google sign-in is not configured.
