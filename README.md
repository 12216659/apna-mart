# Apna Mart

Apna Mart is a React + Vite frontend with an Express API and MongoDB database.

## Requirements

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (includes npm)
- [Visual Studio Code](https://code.visualstudio.com/)
- A MongoDB database, such as a MongoDB Atlas cluster
- Git, if you are cloning the project

Check that Node.js and npm are installed from the VS Code terminal:

```powershell
node --version
npm --version
```

## Step-by-step setup in VS Code (Windows)

### Step 1: Open the project

Open VS Code and choose **File > Open Folder...**. Select the `apna-mart` folder containing this README, the frontend `package.json`, and the `backend` folder.

If you need to clone the project first, open PowerShell and run the following, replacing `<repository-url>` with your Git URL:

```powershell
git clone <repository-url>
cd apna-mart
code .
```

In VS Code, open **Terminal > New Terminal**. The project root is the folder containing the frontend `package.json`.

### Backend setup

#### Step 2: Set up MongoDB

Create a MongoDB Atlas cluster and database user. In Atlas, allow your computer's IP address under **Network Access**, then copy the cluster connection string.

#### Step 3: Create backend environment settings

In a terminal at the project root, create `backend/.env` if it does not already exist:

```powershell
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
```

In VS Code, open `backend/.env` and set the following values:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=<a-random-secret-at-least-32-characters-long>
```

Use the MongoDB connection string from Atlas and replace the placeholders with your database details. URL-encode reserved characters in the database password. Generate a random JWT secret by running this in PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the printed value as `JWT_SECRET`. Do not use the placeholder or share/commit the secret.

#### Step 4: Install backend packages

Open a VS Code terminal, then change into the backend folder and install its packages:

```powershell
cd backend
npm install
```

#### Step 5: Start the backend server

In that same terminal, run:

```powershell
npm run dev
```

Keep the terminal running. The backend is ready when it reports that MongoDB is connected and the API is listening on port 5000.

### Frontend setup

#### Step 6: Open a second terminal

In VS Code, choose **Terminal > New Terminal**. The terminal must be in the project root (the folder containing the frontend `package.json`), not in `backend`. If it opened in `backend`, run:

```powershell
cd ..
```

#### Step 7: Install frontend packages

In the second terminal, install the frontend packages:

```powershell
npm install
```

#### Step 8: Start the frontend

In the same second terminal, run:

```powershell
npm run dev
```

Keep this terminal running and open the URL Vite prints, usually `http://localhost:5173`. The frontend forwards `/api` requests to the backend at `http://localhost:5000`. Both servers must remain running while you use the app.

### Optional: enable Google sign-in

Google sign-in is optional; the app can run without it.

1. Create a Google OAuth **Web application** client ID in Google Cloud and add `http://localhost:5173` to **Authorized JavaScript origins**.
2. Set `GOOGLE_CLIENT_ID` in `backend/.env` to that client ID.
3. In a terminal at the project root, create `.env.local` if it does not already exist:

   ```powershell
   if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
   ```

4. Open `.env.local` and set `VITE_GOOGLE_CLIENT_ID` to the same client ID.
5. Stop and restart both development servers to load the new settings.

Do not put the MongoDB URI or JWT secret in `.env.local`; `VITE_` variables are exposed to the browser.

## Useful URLs and commands

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`
- Backend API routes: `/api/auth/register`, `/api/auth/login`, and `/api/auth/google`
- Stop either development server with **Ctrl+C** in its terminal.
- Create a frontend production build from the project root with `npm run build`.

## Troubleshooting

- **MongoDB connection error:** Check `MONGODB_URI`, the database user's credentials, and the Atlas network access list.
- **`MONGODB_URI` or `JWT_SECRET` is missing:** Confirm `backend/.env` exists and has the required values, then restart the backend.
- **Frontend cannot reach the API:** Confirm the backend is running on port 5000 and the frontend is running on port 5173.
- **Google sign-in is unavailable:** Confirm both Google client ID variables match, the authorized JavaScript origin is `http://localhost:5173`, and restart both development servers.
- If Node.js cannot resolve MongoDB SRV DNS records, set `MONGODB_DNS_SERVERS` in `backend/.env` to a reachable DNS server IP.

## Environment files and data

Environment files contain local credentials and must not be committed. Keep `backend/.env` and `.env.local` private; use the example files only as templates. Customer records are stored in MongoDB in the `apna_mart` database.
