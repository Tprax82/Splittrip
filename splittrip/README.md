# 🧳 SplitTrip

Split trip expenses between friends across any currency, with AI receipt scanning.

## Deploy in ~5 minutes (free)

### Step 1 — Get your Anthropic API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in (or create an account — free)
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-…`) — you'll need it in Step 4

### Step 2 — Put this code on GitHub
1. Go to [github.com](https://github.com) → **New repository**
2. Name it `splittrip`, set to **Private**, click **Create**
3. Upload all these files (drag the whole folder into the GitHub web UI, or use git):
   ```bash
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/YOUR_USERNAME/splittrip.git
   git push -u origin main
   ```

### Step 3 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub** (free)
2. Click **Add New → Project**
3. Select your `splittrip` repo → click **Import**
4. Leave all settings as default → click **Deploy**
5. Wait ~60 seconds — Vercel builds and deploys automatically

### Step 4 — Add your Anthropic API key
1. In Vercel, go to your project → **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-…` (your key from Step 1)
   - **Environment:** Production, Preview, Development (tick all three)
3. Click **Save**
4. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

### Done!
Your app is live at `https://splittrip-xxx.vercel.app` (Vercel gives you a free URL).
Share that URL with anyone — no login required for users.

---

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your ANTHROPIC_API_KEY

npm run dev
# Open http://localhost:5173
```

For local dev, the `/api/scan-receipt` serverless function won't run automatically with Vite.
Install the Vercel CLI to run it locally:
```bash
npm i -g vercel
vercel dev   # runs both the frontend and the API function
```

---

## How it works

| Part | Tech |
|------|------|
| Frontend | React + Vite (no heavy framework) |
| Storage | IndexedDB (browser-native, no database needed) |
| AI scanning | Anthropic Claude claude-opus-4-6 via serverless function |
| Exchange rates | [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) — free, no key, 200+ currencies |
| Hosting | Vercel free tier |
| Cost | ~$0 unless you scan thousands of receipts (Anthropic charges per token) |

## Currencies supported
SGD, MYR, USD, EUR, GBP, JPY, AUD, THB, IDR, INR, HKD, KRW, CNY, TWD, VND, PHP, BDT, PKR, LKR, NZD, CAD, CHF, AED, SAR, QAR, ZAR, MXN, BRL, NOK, SEK, DKK
