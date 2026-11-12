# Apna Mart

Apna Mart is a React Native CLI mobile app for Android and iOS, backed by an Express API and MongoDB.

## Requirements

- Node.js 22.11 or newer and npm
- Android Studio, Android SDK, JDK 17, and an Android emulator or device for Android development
- macOS and Xcode for iOS development
- A MongoDB database for account registration and sign-in

## Set up the backend

Create `backend/.env` with your MongoDB connection string and a private JWT secret:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
PORT=5000
JWT_SECRET=<a-random-secret-at-least-32-characters-long>
```

Generate a secret in PowerShell with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env` files or share the database credentials.

```powershell
cd backend
npm install
npm run dev
```

Leave the backend running while using the app.

## Run the mobile app

From the project root, install the app dependencies and start Metro:

```powershell
npm install
npm start
```

In a second project-root terminal, start an Android emulator or connect an Android device, then run:

```powershell
npm run android
```

On macOS, run `bundle install` from the project root, then run `bundle exec pod install` from the `ios` folder. Start the app from the project root with `npm run ios`.

The API URL is set in `src/config.ts`. The defaults use `10.0.2.2` for the Android emulator and `localhost` for the iOS simulator. For a physical phone, replace the URL with your development computer's LAN IP address and make sure the phone can reach port 5000.

The app's sample stores, products, and prices are illustrative preview data; inventory, checkout, and orders are not connected to the backend. Username/password registration and sign-in use the backend API. Native Google sign-in is not configured.
