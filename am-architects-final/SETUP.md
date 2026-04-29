# AM Architects — Complete Deploy Guide

Everything you need is in this folder. Follow these steps in order.

## 📁 Files in this folder

```
am-architects-final/
├── api/
│   ├── lead.js              ← receives form submissions
│   └── admin-auth.js        ← validates admin password
├── images/
│   ├── balaji-1.jpeg
│   ├── balaji-2.jpeg
│   └── gautam.jpeg
├── index.html               ← the website
├── script.js                ← JavaScript
├── style.css                ← all styles
├── vercel.json              ← Vercel config
├── package.json             ← Node module config
├── .gitignore
└── SETUP.md                 ← this file
```

---

## STEP 1 — Get your 3 secrets ready (5 min)

You need three values before deploying. Save them somewhere.

### 1A. Web3Forms key
1. Go to **https://web3forms.com**
2. Type your client's email (e.g. `studio@am-architects.in`)
3. Click "Get Access Key"
4. Copy the key from the email/screen
5. **Save as: WEB3FORMS_KEY**

### 1B. Admin password
Pick a strong password. Mix upper, lower, numbers, symbols.
Example: `Bal@ji_Studio_2026!`
**Save as: ADMIN_PASSWORD**

### 1C. Token secret
Open Terminal/PowerShell on your computer:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy the long hex string.
**Save as: ADMIN_TOKEN_SECRET**

---

## STEP 2 — Push to GitHub

You said you already have GitHub set up with `byitus/testamarch`. So:

1. Go to your repo on GitHub
2. **Delete every file inside `testamarch/` folder** (one by one, or just delete the folder)
3. **Add file → Upload files** → drag everything from this `am-architects-final` folder
   - Make sure folders (`api/`, `images/`) are preserved
4. Commit changes

---

## STEP 3 — Vercel Settings

Vercel dashboard → testamarch project → **Settings** → **General**:

| Field | Value |
|-------|-------|
| Framework Preset | Other |
| Root Directory | `testamarch` (since files are inside that folder) |
| Build Command | (leave empty) |
| Output Directory | (leave empty) |

Click **Save**.

---

## STEP 4 — Set Environment Variables (THE IMPORTANT PART)

Vercel dashboard → testamarch → **Settings** → **Environment Variables**

Add these 4 one by one:

| Name | Value | Environment |
|------|-------|-------------|
| `WEB3FORMS_KEY` | (from Step 1A) | All |
| `ADMIN_PASSWORD` | (from Step 1B) | All |
| `ADMIN_TOKEN_SECRET` | (from Step 1C) | All |
| `ALLOWED_ORIGINS` | `https://testamarch.vercel.app` | All |

For each: type Name, paste Value, leave "All Environments" checked, click **Save**.

---

## STEP 5 — Deploy

Vercel dashboard → testamarch → **Deployments** → click ⋯ on latest → **Redeploy**.

Wait 30 seconds. Open `https://testamarch.vercel.app`.

---

## STEP 6 — Test

### Test the contact form
1. Scroll to "Begin a Project" section
2. Fill name, phone, email, message
3. Click "Send enquiry"
4. Check the email you registered with Web3Forms — lead should arrive within 1 minute

### Test admin panel
1. Visit `https://testamarch.vercel.app/#admin`
2. Enter the password from Step 1B
3. You should see Projects, Journal, Leads tabs

If both work → **you're live.** 🎉

---

## 🆘 Troubleshooting

**Form submits but no email arrives**
- Check Vercel dashboard → testamarch → Logs (real-time)
- Most likely: typo in `WEB3FORMS_KEY` or you forgot to redeploy after setting env vars

**Admin login says "Server not configured"**
- Means `ADMIN_PASSWORD` or `ADMIN_TOKEN_SECRET` env vars aren't set
- Add them, then redeploy

**"Origin not allowed" errors**
- Make sure `ALLOWED_ORIGINS` exactly matches your Vercel URL
- Format: `https://testamarch.vercel.app` (no trailing slash)

**Site loads but nothing happens**
- Open DevTools (F12) → Console tab
- Send me the screenshot

---

## 🔄 Future content updates

Two ways:

### Easy: Use the admin panel
Visit `yoursite.com/#admin` → log in → edit projects/articles in browser. Changes save to the editor's browser only (localStorage).

### Permanent: Edit the code
Open `script.js`, find the `PROJECTS` array (around line 270) — edit/add directly. Push to GitHub → Vercel auto-deploys.

---

## 🔄 Updating the live site

After any code changes:
```bash
git add .
git commit -m "Update [what you changed]"
git push
```
Vercel auto-deploys in 30 seconds.

---

## ⚠️ Security reminders

- Never commit `.env` files (already in `.gitignore`)
- Use a different password for `ADMIN_PASSWORD` than your other accounts
- If you ever leak the Web3Forms key, just regenerate at web3forms.com — old key auto-revokes
