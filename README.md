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

### Steps to Deploy:
1. **Push to GitHub:** Ensure your code is pushed to a GitHub repository.
2. **Connect to Railway:**
   - Log in to Railway and click **"New Project"**.
   - Select **"Deploy from GitHub repo"** and choose this repository.
3. **Configure Variables:**
   - In your Railway project, go to the **"Variables"** tab.
   - Add the following variables:
     - `LINE_ACCESS_TOKEN`
     - `GEMINI_API_KEY`
   - *Note: Railway automatically provides a `PORT` variable, which the application will use.*
4. **Set Up Webhook:**
   - Once deployed, Railway will provide a public URL (e.g., `https://som-assistant-production.up.railway.app`).
   - Go to your **LINE Developers Console** -> **Messaging API** tab.
   - Set the **Webhook URL** to your Railway URL and ensure it ends with the correct path (if any). In this project, the root `/` handles POST requests.
   - Enable **"Use webhook"**.

## 📝 How it Works
1. The server listens for incoming Webhooks from LINE on the specified port.
2. When a user sends a message, the system forwards the text to Gemini AI.
3. The AI's response is then sent back to the user via the LINE Reply API.

