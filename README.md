# The Room — Mock Interview App

A personal mock-interview website. Paste a job description, get 5 tailored
questions, answer with camera + voice or text, receive a pass/fail verdict.

## Deploy in 10 minutes (no coding required)

### What you need
- An Anthropic API key (£5 of credits is plenty for personal use)
- A free Vercel account
- A free GitHub account

### Step 1 — Get an Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Click **API Keys** in the sidebar → **Create Key**
4. Copy the key (starts with `sk-ant-...`). Save it somewhere safe — you only see it once.
5. Click **Plans & Billing** → add at least £5 of credit

### Step 2 — Upload the project to GitHub
1. Go to https://github.com and sign up if you don't have an account
2. Click the **+** icon top right → **New repository**
3. Name it `interview-app` (or anything you like). Keep it Public or Private — your choice.
4. Don't tick "Add a README" — just click **Create repository**
5. On the next page, click **uploading an existing file**
6. Drag and drop ALL the files and folders from this project (the entire contents — `package.json`, `pages/`, `next.config.js`, `.gitignore`, etc.)
   - **IMPORTANT**: do NOT upload `.env.local` if it exists. The `.gitignore` should stop this, but double-check.
7. Click **Commit changes**

### Step 3 — Deploy to Vercel
1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New** → **Project**
3. Find `interview-app` in the list and click **Import**
4. Before clicking Deploy, expand **Environment Variables**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: paste your key from Step 1
   - Click **Add**
5. Click **Deploy** and wait ~2 minutes
6. Vercel gives you a URL like `interview-app-yourname.vercel.app` — that's your website!

### Step 4 (optional) — Custom domain
- In Vercel, click your project → **Settings** → **Domains**
- Buy a domain (£5–15/year from Namecheap, Google Domains, etc.) and follow Vercel's instructions to connect it
- Your site will be live at `interview.yourname.com` or whatever you choose

## Running it on your laptop instead
If you'd rather just run it locally without uploading anywhere:

1. Install Node.js from https://nodejs.org (LTS version)
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Navigate to the project folder: `cd path/to/interview-app`
4. Run: `npm install`
5. Copy `.env.local.example` to a new file called `.env.local` and paste your API key inside
6. Run: `npm run dev`
7. Open http://localhost:3000 in your browser

## Cost
Each interview costs roughly £0.05–£0.15 in Anthropic API credits depending on the
length of the job description and your answers. £5 of credit gives you 30–100
mock interviews. The Vercel hosting is free.

## Privacy
- Your camera feed never leaves your computer — it's just for you to see yourself.
- Your typed/spoken answers ARE sent to Anthropic's API for assessment.
- Your session is saved in your browser's local storage only (not on any server).
- Don't share your API key with anyone. If it leaks, regenerate it at console.anthropic.com.

## Files in this project
- `pages/index.js` — the main React app (UI)
- `pages/api/generate-questions.js` — server function that creates questions
- `pages/api/assess.js` — server function that grades your answers
- `package.json` — dependency list (Vercel reads this)
- `next.config.js` — Next.js config (minimal)
- `.env.local.example` — template for the API key (don't put real keys in here)
- `.gitignore` — tells GitHub which files to skip
