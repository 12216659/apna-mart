# Apna Mart

Apna Mart is a JavaScript app built with React Native and Expo. Its Node.js/Express API uses PostgreSQL for customer accounts. The mobile app uses Expo Location for foreground GPS and `react-native-maps` for maps.

## Requirements

- Node.js 22.11 or newer and npm
- Android Studio, Android SDK, JDK 17, and an Android emulator or device for Android development
- macOS and Xcode for iOS native builds (Expo Go can be used for basic testing)
- A local or hosted PostgreSQL database
- A Google Maps API key for the Android map; configure Maps SDK for Android in Google Cloud

## Configure the app

Copy `.env.example` to `.env`. Set `EXPO_PUBLIC_API_URL` to the backend URL reachable from the device. For a physical phone, use your computer's LAN IP and make sure both devices share a network. The app defaults to the Android emulator and iOS simulator addresses.

Set `GOOGLE_MAPS_ANDROID_API_KEY` in `.env` to enable the Android map. Optionally set `GOOGLE_MAPS_IOS_API_KEY` to use Google Maps on iOS; without it, iOS uses Apple Maps. Restrict keys to the relevant app identifiers and APIs.

Development builds allow local HTTP requests to reach the Node API. Use HTTPS for deployed APIs and set `NODE_ENV=production` when generating a production native build.

## Set up the backend

Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL` to your PostgreSQL connection string and `JWT_SECRET` to a private random secret of at least 32 characters. Set `DATABASE_SSL=true` if your database provider requires SSL.

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

Sample products and prices remain illustrative; inventory, checkout, and orders are not connected to the backend. Username/password registration and sign-in use PostgreSQL. Native Google sign-in is not configured.
