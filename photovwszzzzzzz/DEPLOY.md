# 🚀 AM Architects — Deployment Guide

This walks you through deploying the site to Vercel via GitHub. **Total time: 15–20 minutes.**

---

## 📁 Folder structure (what you have)

```
am-architects/
├── api/
│   ├── lead.js              ← receives form submissions
│   └── admin-auth.js        ← validates admin password
├── public/
│   ├── index.html           ← the website
│   ├── style.css
│   ├── script.js
│   ├── config.local.js      ← public config (WhatsApp, admin route)
│   └── images/              ← team photos
├── vercel.json              ← deployment config
├── package.json             ← Node module config
├── .env.example             ← template for env vars (committed)
├── .env                     ← real env vars (NOT committed — you create this)
├── .gitignore
└── DEPLOY.md                ← this file
```

---

## Step 1 — Get your secrets ready (5 min)

### A. Web3Forms key
1. Go to **https://web3forms.com**
2. Enter your client's email (e.g. `studio@am-architects.in`)
3. Click "Get Access Key" → copy the key
4. Save it for Step 4

### B. Admin password
Pick a strong password — mix of upper/lower/numbers/symbols.
Example: `Bal@ji_Studio_2026!`
Save it for Step 4.

### C. Token secret
Open Terminal/Command Prompt and run:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy the long hex string. Save for Step 4.

---

## Step 2 — Push to GitHub (5 min)

### If you haven't already installed Git:
- Windows: download from https://git-scm.com
- Mac: `brew install git` or use Xcode tools

### Push the project:

1. **Create a new repo on GitHub:**
   - Go to https://github.com/new
   - Repository name: `am-architects`
   - Set to **Private** (recommended) or Public
   - Don't initialize with README (we already have files)
   - Click "Create repository"

2. **In your project folder**, open Terminal and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/am-architects.git
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your GitHub username.

3. Refresh GitHub — you should see all files except `.env` and `config.local.js`.

---

## Step 3 — Connect to Vercel (3 min)

1. Go to **https://vercel.com**
2. Click "Sign Up" → choose **Continue with GitHub**
3. Once signed in, click **"Add New..."** → **Project**
4. Find `am-architects` in the list → click **Import**
5. Configuration screen:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (default)
   - **Build Command:** leave empty
   - **Output Directory:** `public`
6. **DON'T click Deploy yet** — first set up env vars in Step 4

---

## Step 4 — Set environment variables (2 min)

Still on the Vercel deploy screen, expand **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `WEB3FORMS_KEY` | (from Step 1A) |
| `ADMIN_PASSWORD` | (from Step 1B) |
| `ADMIN_TOKEN_SECRET` | (from Step 1C) |
| `ALLOWED_ORIGINS` | `https://am-architects.vercel.app` |

Click **Deploy**. Wait ~30 seconds.

---

## Step 5 — Update ALLOWED_ORIGINS with real URL (1 min)

Once deployed, you'll see your live URL — something like:
`https://am-architects-abc123.vercel.app`

1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Edit `ALLOWED_ORIGINS` to your real URL:
   `https://am-architects-abc123.vercel.app`
3. Go to **Deployments** → click the latest → ⋯ menu → **Redeploy**

---

## Step 6 — Test it (3 min)

1. Visit your live URL.
2. **Test contact form:** fill it, submit. Email should arrive at the address you registered with Web3Forms.
3. **Test admin panel:** Visit `yoursite.com/#admin` — enter your password — should log you in.
4. **Test wrong password:** enter a wrong one. Should get "Invalid password" toast.

If everything works → **you're live!** 🎉

---

## 🛠 Custom domain (optional)

If your client has a domain (e.g. `am-architects.in`):

1. Vercel dashboard → project → **Settings** → **Domains**
2. Add the domain → follow DNS instructions
3. Update `ALLOWED_ORIGINS` env var to include the new domain
4. Redeploy

---

## 🔄 Future updates

Anytime you change the code:
```bash
git add .
git commit -m "Update home hero copy"
git push
```
Vercel auto-deploys in ~30 seconds. No manual deploys needed.

---

## 🆘 If something breaks

**Form submits but no email arrives:**
- Check Vercel dashboard → your project → **Logs** (real-time)
- Most common: `WEB3FORMS_KEY` typo, or you forgot to redeploy after setting env var

**Admin password doesn't work:**
- `ADMIN_PASSWORD` env var must match exactly — no extra spaces
- Check `ADMIN_TOKEN_SECRET` is set (without it, login still fails)

**"Origin not allowed" errors:**
- `ALLOWED_ORIGINS` must include your actual deployed URL
- Comma-separated, no spaces, full https:// included

**Site loads but nothing happens on click:**
- Open DevTools → Console tab. Any red errors? Send me a screenshot.

---

## 🔒 Security model — what's protected now

| Asset | Where it lives | Risk if leaked |
|-------|---------------|-----------------|
| Web3Forms key | Vercel env var (server-side) | Browser **can't see it** ✅ |
| Admin password | Vercel env var (server-side) | Browser **can't see it** ✅ |
| Token secret | Vercel env var (server-side) | Browser **can't see it** ✅ |
| WhatsApp number | `config.local.js` (browser) | Public anyway, fine ✅ |
| Admin URL hash | `config.local.js` (browser) | Mild — change if exposed |

**You now have proper backend security.** A visitor with DevTools open can no longer extract any secrets.
