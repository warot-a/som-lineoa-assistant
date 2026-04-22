# Som Assistant 🍊

Som Assistant is an intelligent LINE Bot powered by Google Gemini AI, designed to be your personal assistant directly within the LINE application.

## ✨ Features
- **AI Powered:** Utilizes the latest Gemini models for natural language processing and intelligent responses.
- **Fast & Lightweight:** Built with [Bun](https://bun.sh/) for high performance and low resource consumption.
- **Seamless Integration:** Direct connection with the LINE Messaging API.

## 🛠 Tech Stack
- **Runtime:** Bun
- **Language:** TypeScript
- **AI Model:** Google Generative AI (Gemini)
- **Framework:** Bun.serve (Built-in HTTP Server)

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

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
LINE_ACCESS_TOKEN=your_line_access_token
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
   - Log in to Railway and click **"New Project"**.
   - Select **"Deploy from GitHub repo"** and choose this repository.
3. **Configure Variables:** Add `LINE_ACCESS_TOKEN` and `GEMINI_API_KEY` in the **Variables** tab.

### Option 2: Deploy via Railway CLI
If you prefer deploying directly from your terminal:

1. **Install CLI:** `npm i -g @railway/cli`
2. **Login:** `railway login`
3. **Deploy:** `railway up`
   - *Tip: Use `railway up -d` for detached mode.*
4. **Set Variables:** `railway variables set $(cat .env | xargs)`

### 🔗 Webhook Setup
- Once deployed, get your public URL from Railway.
- In **LINE Developers Console**, set the **Webhook URL** to your Railway URL.
- Enable **"Use webhook"**.

## 📝 How it Works
1. The server listens for incoming Webhooks from LINE on the specified port.
2. When a user sends a message, the system forwards the text to Gemini AI.
3. The AI's response is then sent back to the user via the LINE Reply API.

