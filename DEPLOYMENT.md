# ZenithCRM Deployment Guide

This guide will walk you through deploying ZenithCRM to production using Render (backend) and Netlify (frontend).

## Prerequisites

- [x] GitHub account
- [x] Render.com account (free tier available)
- [x] Netlify account (free tier available)
- [x] Supabase project with PostgreSQL database

---

## Step 1: Push Code to GitHub

Your repository has been created at: **https://github.com/mcankeskiinn-max/zenithcrm**

Run the following commands in your project directory:

```bash
cd C:\Users\mcank\.gemini\antigravity\scratch\sigorta-crm
git init
git add .
git commit -m "Initial commit - ZenithCRM v1.0"
git branch -M main
git remote add origin https://github.com/mcankeskiinn-max/zenithcrm.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select `zenithcrm` repository
4. Render will auto-detect the `render.yaml` configuration

### 2.2 Configure Environment Variables
Add the following in Render's Environment Variables section:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Copy from Supabase (Settings → Database → Connection String) |
| `CLIENT_URL` | `https://your-app.netlify.app` | Update after Netlify deployment |
| `JWT_SECRET` | Auto-generated | Render will generate this |
| `JWT_REFRESH_SECRET` | Auto-generated | Render will generate this |

### 2.3 Deploy
- Click **"Create Web Service"**
- Render will build the Docker image and deploy
- Wait for the build to complete (~5-10 minutes)
- Note your backend URL: `https://zenithcrm-backend-xxxx.onrender.com`

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Connect GitHub Repository
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize
4. Choose `zenithcrm` repository

### 3.2 Configure Build Settings
Netlify will auto-detect settings from `netlify.toml`, but verify:
- **Build command**: `cd client && npm install && npm run build`
- **Publish directory**: `client/dist`

### 3.3 Add Environment Variable
In Netlify's **Site settings** → **Environment variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://zenithcrm-backend-xxxx.onrender.com` |

Replace with your actual Render backend URL.

### 3.4 Deploy
- Click **"Deploy site"**
- Wait for build to complete (~3-5 minutes)
- Note your frontend URL: `https://your-app.netlify.app`

---

## Step 4: Update Backend CORS

Go back to Render and update the `CLIENT_URL` environment variable with your Netlify URL:
- `CLIENT_URL` = `https://your-app.netlify.app`

Trigger a manual redeploy in Render for the change to take effect.

---

## Step 5: Run Database Migrations

Render automatically runs `prisma migrate deploy` on startup (configured in Dockerfile).

To verify migrations ran successfully:
1. Go to Render Dashboard → Your Service → Logs
2. Look for: `✓ Prisma Migrate applied X migrations`

---

## Step 6: Seed Production Database (Optional)

If you want to seed the production database with initial data:

1. In Render Dashboard, go to your service
2. Click **"Shell"** tab
3. Run:
```bash
npm run seed
```

This will create:
- Admin user: `admin@sigorta.com` / `password123`
- Sample branches and policy types
- Test sales data

> [!WARNING]
> Change the admin password immediately after first login!

---

## Step 7: Verify Deployment

### Backend Health Check
Visit: `https://zenithcrm-backend-xxxx.onrender.com/`

Expected response:
```json
{
  "message": "Sigorta CRM API is running",
  "branchCount": 4,
  "ptCount": 5
}
```

### Frontend Login
1. Visit: `https://your-app.netlify.app`
2. Login with: `admin@sigorta.com` / `password123`
3. Verify dashboard loads correctly

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify `DATABASE_URL` is correct
- Ensure Supabase allows connections from Render IPs

### Frontend can't connect to backend
- Verify `VITE_API_URL` in Netlify matches Render URL
- Check CORS settings: `CLIENT_URL` in Render should match Netlify URL
- Open browser DevTools → Network tab to see API errors

### Database connection errors
- Ensure Supabase connection pooling is enabled
- Check if SSL mode is required (add `?sslmode=require` to DATABASE_URL)

---

## Post-Deployment Checklist

- [ ] Change admin password
- [ ] Set up custom domain (optional)
- [ ] Enable Render auto-deploy on Git push
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy for database
- [ ] Review and adjust rate limits in production

---

## Useful Commands

```bash
# View backend logs
# Go to Render Dashboard → Logs

# Redeploy backend
# Render Dashboard → Manual Deploy

# Redeploy frontend
# Netlify Dashboard → Deploys → Trigger deploy

# Run migrations manually
# Render Shell: npx prisma migrate deploy
```

---

> [!TIP]
> Both Render and Netlify offer free SSL certificates and automatic HTTPS. Your app will be secure by default!
