# 🚀 ForensicAI — Deployment Guide

Step-by-step instructions to deploy ForensicAI with the **frontend on Vercel** and the **backend on Render**.

---

## 📋 Prerequisites

- [x] Code pushed to GitHub: `https://github.com/cybersecurity26/ForensicAI`
- [ ] [Vercel account](https://vercel.com/signup) (free tier works)
- [ ] [Render account](https://render.com/register) (free tier works)
- [ ] [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) (free tier — M0 cluster)
- [ ] AI API key (OpenAI / Gemini / Mistral)

---

## Phase 1: Set Up MongoDB Atlas (Cloud Database)

> You need a cloud MongoDB instance since Render/Vercel can't access your local MongoDB.

### Steps

- [ ] **1.1** Go to [MongoDB Atlas](https://cloud.mongodb.com) → Sign in or Register

- [ ] **1.2** Create a Free Cluster
  - Click **"Build a Database"**
  - Select **M0 FREE** tier
  - Choose a cloud provider & region (pick one closest to your Render region)
  - Click **"Create Deployment"**

- [ ] **1.3** Set Up Database Access
  - Go to **Database Access** → **Add New Database User**
  - Username: `forensicai`
  - Password: (generate a strong one, **save it!**)
  - Role: **Read and Write to any database**
  - Click **Add User**

- [ ] **1.4** Set Up Network Access
  - Go to **Network Access** → **Add IP Address**
  - Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
  - This is needed for Render to connect
  - Click **Confirm**

- [ ] **1.5** Get Connection String
  - Go to **Database** → Click **"Connect"** on your cluster
  - Select **"Drivers"**
  - Copy the connection string, it looks like:
    ```
    mongodb+srv://forensicai:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```
  - Replace `<password>` with your actual password
  - Add the database name before `?`:
    ```
    mongodb+srv://forensicai:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/forensicai?retryWrites=true&w=majority
    ```
  - **Save this URI** — you'll need it for Render

---

## Phase 2: Deploy Backend on Render

### Steps

- [ ] **2.1** Go to [Render Dashboard](https://dashboard.render.com) → Click **"New +"** → **"Web Service"**

- [ ] **2.2** Connect Your GitHub Repository
  - Click **"Connect a repository"** → Authorize Render on GitHub
  - Select **`cybersecurity26/ForensicAI`**

- [ ] **2.3** Configure the Service
  Fill in these settings:

  | Setting | Value |
  |---|---|
  | **Name** | `forensicai-api` |
  | **Region** | Choose closest to your users |
  | **Branch** | `main` |
  | **Root Directory** | `server` |
  | **Runtime** | `Node` |
  | **Build Command** | `npm install` |
  | **Start Command** | `node server.js` |
  | **Instance Type** | `Free` (or paid for better performance) |

- [ ] **2.4** Add Environment Variables
  Click **"Advanced"** → **"Add Environment Variable"** and add each:

  | Key | Value |
  |---|---|
  | `PORT` | `10000` |
  | `MONGODB_URI` | `mongodb+srv://forensicai:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/forensicai?retryWrites=true&w=majority` |
  | `JWT_SECRET` | Generate a strong random string (32+ chars) |
  | `AI_PROVIDER` | `openai` (or `gemini` or `mistral`) |
  | `AI_API_KEY` | Your actual AI API key |
  | `AI_MODEL` | `gpt-4` (or `gemini-1.5-flash` or `mistral-large-latest`) |
  | `AI_TEMPERATURE` | `0.3` |
  | `AI_MAX_TOKENS` | `2048` |
  | `UPLOAD_DIR` | `./uploads` |
  | `MAX_FILE_SIZE` | `5368709120` |
  | `NODE_ENV` | `production` |

  > ⚠️ **Generate JWT_SECRET** using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- [ ] **2.5** Click **"Create Web Service"**
  - Render will build and deploy your backend
  - Wait for the deploy to finish (2-3 minutes)

- [ ] **2.6** Note Your Backend URL
  - After deploy, Render gives you a URL like:
    ```
    https://forensicai-api.onrender.com
    ```
  - **Save this URL** — you'll need it for the Vercel frontend

- [ ] **2.7** Configure CORS on Backend
  Update `server/server.js` to allow your Vercel frontend domain:
  ```js
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'https://your-app.vercel.app',  // ← add your Vercel URL here
    ],
    credentials: true,
  }))
  ```
  Commit and push — Render will auto-redeploy.

---

## Phase 3: Deploy Frontend on Vercel

### Step 3.0: Update Client for Production

Before deploying, the client needs to know the backend URL (it currently uses a Vite proxy for local dev).

- [ ] **3.0a** Create a production-ready API base in `client/src/api.js`:

  Change line 6 from:
  ```js
  const BASE = '/api'
  ```
  To:
  ```js
  const BASE = import.meta.env.VITE_API_URL || '/api'
  ```

- [ ] **3.0b** Commit and push this change:
  ```bash
  git add -A
  git commit -m "feat: add env-based API URL for production deployment"
  git push origin main
  ```

### Steps

- [ ] **3.1** Go to [Vercel Dashboard](https://vercel.com/dashboard) → Click **"Add New..."** → **"Project"**

- [ ] **3.2** Import Your GitHub Repository
  - Connect your GitHub account if not already
  - Select **`cybersecurity26/ForensicAI`**

- [ ] **3.3** Configure the Project

  | Setting | Value |
  |---|---|
  | **Project Name** | `forensicai` |
  | **Framework Preset** | `Vite` |
  | **Root Directory** | `client` ← **Important! Click "Edit" and set to `client`** |
  | **Build Command** | `npm run build` |
  | **Output Directory** | `dist` |
  | **Install Command** | `npm install` |

- [ ] **3.4** Add Environment Variables

  | Key | Value |
  |---|---|
  | `VITE_API_URL` | `https://forensicai-api.onrender.com/api` |

  > Replace with your actual Render backend URL from step 2.6

- [ ] **3.5** Click **"Deploy"**
  - Vercel will build and deploy your frontend
  - Wait for the build to finish (1-2 minutes)

- [ ] **3.6** Note Your Frontend URL
  - Vercel gives you a URL like:
    ```
    https://forensicai.vercel.app
    ```

- [ ] **3.7** Update Backend CORS with Vercel URL
  - Go back to `server/server.js`
  - Add your actual Vercel URL to the CORS origin array
  - Commit and push — Render auto-redeploys

---

## Phase 4: Add SPA Rewrites (Important!)

Since ForensicAI uses client-side routing (React Router), you need to configure Vercel to redirect all routes to `index.html`.

- [ ] **4.1** Create `client/vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

- [ ] **4.2** Commit and push:
  ```bash
  git add -A
  git commit -m "fix: add Vercel SPA rewrites for client-side routing"
  git push origin main
  ```
  Vercel will auto-redeploy.

---

## Phase 5: Verify Deployment

- [ ] **5.1** Open your Vercel frontend URL
- [ ] **5.2** Register a new account
- [ ] **5.3** Log in and verify dashboard loads
- [ ] **5.4** Create a test case
- [ ] **5.5** Upload a test evidence file
- [ ] **5.6** Parse the evidence
- [ ] **5.7** Generate an AI report
- [ ] **5.8** Check timeline reconstruction
- [ ] **5.9** Test global search
- [ ] **5.10** Toggle dark/light theme
- [ ] **5.11** Check notifications

---

## 🔧 Troubleshooting

### Backend won't start on Render
- Check Render logs: **Dashboard → forensicai-api → Logs**
- Verify all environment variables are set correctly
- Make sure `MONGODB_URI` is correct and MongoDB Atlas allows `0.0.0.0/0`

### Frontend can't reach API
- Check that `VITE_API_URL` is set to `https://your-render-url.onrender.com/api` (with `/api` at the end)
- Check that CORS in `server.js` includes your Vercel domain
- Open browser DevTools (F12) → Network tab → look for failed API calls

### Login/Register fails
- Check the Render logs for MongoDB connection errors
- Verify `JWT_SECRET` is set
- Make sure MongoDB Atlas user has read/write permissions

### AI report generation fails
- Verify `AI_API_KEY` is valid and has credits
- Check `AI_PROVIDER` matches the key (e.g., OpenAI key with `openai` provider)
- Check Render logs for specific error messages

### Pages show 404 on refresh
- Make sure `client/vercel.json` with SPA rewrites is deployed (Phase 4)

### Render free tier spins down
- Free Render instances spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds
- Upgrade to paid tier for always-on instances

---

## 📊 Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│   Vercel (Frontend) │  HTTPS  │  Render (Backend)   │
│   React + Vite      │ ──────► │  Node.js + Express  │
│   forensicai.       │         │  forensicai-api.    │
│   vercel.app        │         │  onrender.com       │
│                     │         │                     │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                                           │ MongoDB Driver
                                           │
                                ┌──────────▼──────────┐
                                │                     │
                                │   MongoDB Atlas     │
                                │   (Cloud Database)  │
                                │   Free M0 Cluster   │
                                │                     │
                                └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │                     │
                                │   AI Provider API   │
                                │   OpenAI / Gemini   │
                                │   / Mistral         │
                                │                     │
                                └─────────────────────┘
```

---

## ✅ Deployment Checklist Summary

| Step | Status |
|---|---|
| MongoDB Atlas cluster created | ☐ |
| Database user created | ☐ |
| Network access configured (0.0.0.0/0) | ☐ |
| Connection string saved | ☐ |
| Render web service created | ☐ |
| Render env vars configured | ☐ |
| Render deploy successful | ☐ |
| Backend URL saved | ☐ |
| Client `api.js` updated for env-based URL | ☐ |
| Vercel project created | ☐ |
| Vercel root directory set to `client` | ☐ |
| `VITE_API_URL` env var added | ☐ |
| Vercel deploy successful | ☐ |
| `vercel.json` SPA rewrites added | ☐ |
| CORS updated with Vercel URL | ☐ |
| Full verification passed | ☐ |
