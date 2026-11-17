# AutoBot AI — Frontend React Dashboard

Modern, production-ready React frontend designed specifically for the **Multi-Tenant AI Chatbot Backend (Instagram & WhatsApp)**.

---

## 🚀 Key Highlights & Capabilities

### 1. Role-Based Access Control (RBAC) & Tenant Isolation
- **Super Administrator**:
  - Full multi-tenant governance dashboard.
  - Organization provisioning modal with automatic tier limits (`free`, `starter`, `pro`, `enterprise`) or custom quota overrides.
  - Search tenants by name or slug with real-time filtering by subscription tier and active/deactivated state.
  - Instant quota modification and tenant deactivation/reactivation.
  - Drill-down quota & consumption inspector (`messages_used`, `bots_used`, `documents_used`).
  - Cluster health monitor (PostgreSQL latency, Redis latency, uptime, environment).
- **Client Administrator (Business Admin)**:
  - Isolated tenant workspace dashboard.
  - Live usage meters with progress bars and reset reminders.
  - **AI Chatbot Manager**: configure bot prompt instructions, choose between OpenAI (`gpt-4o-mini`) and Gemini (`gemini-2.0-flash`), adjust temperature (0.1), and toggle RAG.
  - **Live Chat Simulator**: test bot conversation flow directly in the UI.
  - **Vector Knowledge Base**: upload documents (.pdf, .txt, .docx), inspect vector chunking, and test cosine similarity semantic search against Pinecone.
  - **Omnichannel Meta Integrations**: configure Meta Webhook endpoint, verify token (`piyush`), and toggle Instagram Direct Messages & WhatsApp Cloud API.
  - **Organization Settings**: inspect tenant ID, company slug, plan tier, and JWT session status.

### 2. Architecture & Tech Stack
- **Framework**: React 19 + TypeScript (Strict mode & type safety matching Pydantic schemas)
- **Build Tool**: Vite 8 with integrated proxy for FastAPI backend (`http://localhost:8000`)
- **Styling**: Tailwind CSS v4 with dark mode, glassmorphic cards, custom scrollbars, and fluid animations
- **State & Data Layer**:
  - Axios HTTP client with automatic JWT token attachment
  - Transparent Refresh Token rotation on 401 Unauthorized responses
  - React Context (`AuthProvider`) for persistent session management and role guards

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> [!TIP]
> The Vite development server automatically proxies `/api` and `/health` requests to `http://localhost:8000`, eliminating CORS hurdles during local development.

---

## 🌐 Deploying to Vercel

### Option A: Via Vercel Web Dashboard (Recommended)

1. **Push your repository** to GitHub/GitLab.
2. In the [Vercel Dashboard](https://vercel.com/new), click **"Add New Project"** and import your repository.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click "Edit" and choose `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set Environment Variables** in Vercel:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://your-backend-api.onrender.com` | Your live backend public URL (no trailing slash) |
   | `VITE_APP_NAME` | `AutoBot AI` | Application Name |
   | `VITE_APP_ENV` | `production` | Environment name |
5. Click **Deploy**.

> [!NOTE]
> Both `frontend/vercel.json` and a root `vercel.json` are included with single-page application (SPA) rewrite rules so that routing and direct page refreshes (e.g. `/admin/businesses`, `/dashboard`) work seamlessly without 404 errors.

### Option B: Deploying via Vercel CLI
```bash
cd frontend
npx vercel
# Follow prompts to link and deploy
npx vercel --prod
```

### 🔒 Backend CORS Configuration
Ensure your deployed Vercel domain (e.g. `https://instabotfr.vercel.app` or your project domain) is added to `CORS_ORIGINS` in your backend `.env`:
```env
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://your-app.vercel.app"
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@example.com` | `SuperSecurePassword123!` |
| **Client Admin** | Created dynamically via the Super Admin "New Tenant" button | Set during provisioning |
