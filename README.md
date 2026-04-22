# Som Assistant 🍊
[![CI](https://github.com/warot-a/som-lineoa-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/warot-a/som-lineoa-assistant/actions/workflows/ci.yml)


Som Assistant is an intelligent LINE Bot powered by Google Gemini AI, designed to be your personal assistant directly within the LINE application.

## ✨ Features
- **AI Powered:** Utilizes the latest Gemini models for natural language processing and intelligent responses.
- **Fast & Lightweight:** Built with [Bun](https://bun.sh/) for high performance and low resource consumption.
- **Seamless Integration:** Direct connection with the LINE Messaging API.

## 🛠 Tech Stack
- **Runtime:** Bun
- **Language:** TypeScript
- **AI Model:** Google Generative AI (Gemini)
- **Framework:** [ElysiaJS](https://elysiajs.com/) (High-performance web framework for Bun)

## 🚀 Installation & Setup

### 1. Prerequisites
Before you begin, ensure you have:
- [Bun](https://bun.sh/) installed on your machine.
- **LINE Channel Access Token:** Obtain this from the [LINE Developers Console](https://developers.line.biz/).
- **Gemini API Key:** Obtain this from [Google AI Studio](https://aistudio.google.com/).

### 2. Install Dependencies
```bash
bun install
```

### 3. **Environment Variables**
Create a `.env` file in the root directory and add the following:
```env
LINE_ACCESS_TOKEN=your_line_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### 4. Run the Project
**For Development (with Hot Reload):**
```bash
bun run dev
```

**For Production:**
```bash
bun run start
```

## ☁️ Deployment to Railway

This project is ready to be deployed on [Railway](https://railway.app/).

### Option 1: Deploy via GitHub (CI/CD)
1. **Push to GitHub:** Ensure your code is pushed to a GitHub repository.
2. **Connect to Railway:**
   - **New Project:** Click **"New Project"** > **"Deploy from GitHub repo"**.
   - **Existing Project:** Inside your project dashboard, click **"New"** > **"GitHub Repo"**.
   - Select this repository to create a new service.
3. **Configure Variables:** Add the following variables in the **Variables** tab:
   - `LINE_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `GEMINI_API_KEY`
4. **Settings (Railway UI):** In the **Settings** tab, configure the following:
   - **Builder:** Select `Railpack`
   - **Custom Build Command:** `bun install`
   - **Custom Start Command:** `bun run index.ts`

### Option 2: Deploy via Railway CLI
If you prefer deploying directly from your terminal:

1. **Install CLI:** `npm i -g @railway/cli`
2. **Login:** `railway login`
3. **Link Project:** `railway link` (if not already linked)
4. **Set Variables:** 
   ```bash
   railway variables set LINE_ACCESS_TOKEN=xxx LINE_CHANNEL_SECRET=xxx GEMINI_API_KEY=xxx
   ```
   *Or bulk upload from .env:*
   ```bash
   railway variables set $(cat .env | xargs)
   ```
5. **Deploy:** `railway up`

### 🔗 Webhook Setup
- Once deployed, get your public URL from Railway.
- In **LINE Developers Console**, set the **Webhook URL** to your Railway URL.
- Enable **"Use webhook"**.

## 📝 How it Works
1. The server listens for incoming Webhooks from LINE on the specified port.
2. When a user sends a message, the system forwards the text to Gemini AI.
3. The AI's response is then sent back to the user via the LINE Reply API.

