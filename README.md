# AICA
<img src="frontend/public/aica_complex-nobg.png" alt="AICA Logo" width="150">

# ![AICA](https://img.shields.io/badge/AICA-AI%20Communication%20Assistant-blue?style=for-the-badge)

**AICA** (AI Communication Assistant) is an intelligent email composition platform designed to help users write clearer, context-aware, and tone-appropriate emails quickly and efficiently. Leverage AI-powered assistance to craft professional communications tailored to your audience and purpose.

---

## 📚 Documentation

For detailed guides, technical info, and step-by-step instructions, visit our wiki:

- [Home](https://github.com/Etown-CS170/2025-AICA/wiki) – Overview, app idea, and motivation
- [Core Features](https://github.com/Etown-CS170/2025-AICA/wiki/Core-Features) – All features available on AICA
- [Installation & Setup](https://github.com/Etown-CS170/2025-AICA/wiki/Installation-&-Setup) – How to run the project locally
- [Tech Stack](https://github.com/Etown-CS170/2025-AICA/wiki/Tech-Stack) – Frontend, backend, and libraries
- [Project Structure](https://github.com/Etown-CS170/2025-AICA/wiki/Project-Structure) – Directory structure and file organization
- [API Documentation](https://github.com/Etown-CS170/2025-AICA/wiki/API-Documentation) – Comprehensive API reference with examples and error handling
- [Our Team](https://github.com/Etown-CS170/2025-AICA/wiki/Our-Team) - Meet the developers behind AICA

---

## Prerequisites

Before starting, ensure you have:
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [Auth0 Account](https://auth0.com/)
- [Microsoft Azure Account](https://azure.microsoft.com/) (optional, for Outlook integration)

---

## Quick Setup

### 1. Clone & Navigate
```bash
git clone https://github.com/Etown-CS170/2025-AICA.git
cd 2025-AICA
```

### 2. Install Dependencies
```bash
npm run install:all
```

This installs all dependencies for root, backend, and frontend.

### 3. Set Up Environment Variables

#### Backend Configuration

Copy the example environment file and configure it:
```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` with your credentials:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200

# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=https://aica-backend-api

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/aica
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/aica

# Microsoft Outlook Configuration (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:4200/outlook/callback
```

**Get your credentials:**
- **OpenAI API Key**: [OpenAI Dashboard](https://platform.openai.com/api-keys)
- **Auth0 Domain & Audience**: [Auth0 Dashboard](https://manage.auth0.com/)
- **MongoDB URI**: Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Microsoft Client ID & Secret**: [Azure Portal](https://portal.azure.com/) (optional)

#### Frontend Configuration

Update `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  auth0: {
    domain: 'your-auth0-domain.auth0.com',
    clientId: 'your-auth0-client-id',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://aica-backend-api'
    },
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true
  },
  microsoft: {
    clientId: 'your-microsoft-client-id',
    redirectUri: 'http://localhost:4200/outlook/callback',
    tenantId: 'common'
  }
};
```

**Replace placeholders:**
- `your-auth0-domain` → Your Auth0 domain
- `your-auth0-client-id` → Your Auth0 client ID
- `your-microsoft-client-id` → Your Microsoft client ID (optional)

⚠️ **CRITICAL**: Never commit `.env` files or API keys to version control!

### 4. Configure Auth0

1. Create a **Single Page Application** in Auth0
2. Set **Allowed Callback URLs**: `http://localhost:4200`
3. Set **Allowed Logout URLs**: `http://localhost:4200`
4. Set **Allowed Web Origins**: `http://localhost:4200`
5. Create an **API** with identifier: `https://aica-backend-api`

### 5. Configure Microsoft Outlook Integration (Optional)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **App registrations** → **New registration**
3. Set **Redirect URI**: `http://localhost:4200/outlook/callback`
4. Under **API permissions**, add:
   - `Mail.Send`
   - `Mail.Read`
   - `User.Read`
   - `offline_access`
5. Under **Certificates & secrets**, create a **New client secret**
6. Copy the **Application (client) ID** and **Client secret value**

### 6. Start MongoDB

**Local MongoDB:**
```bash
# macOS/Linux
sudo systemctl start mongod

# Or start via MongoDB Compass
```

**MongoDB Atlas:**
- Ensure your cluster is running
- Verify IP whitelist includes your current IP

### 7. Start Development Servers
```bash
npm run dev
```

This starts both servers concurrently:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:4200

**Expected output:**
```
✅ MongoDB connected successfully
🚀 AICA Backend Server running on port 3000
📧 Environment: development
```

---

## Alternative Setup

### Backend Only
```bash
cd backend
npm install
npm run dev
```

### Frontend Only
```bash
cd frontend
npm install
npm start
```

---

## Verify Installation

1. Open browser to http://localhost:4200
2. You should see the AICA login page
3. Click **Sign In** to test Auth0 authentication
4. After login, test email generation:
   - Select a tone (Professional, Friendly, etc.)
   - Select an audience (Professor, Student, etc.)
   - Enter a prompt or use a template
   - Click **Send** to generate an email
5. **(Optional)** Test Outlook integration:
   - Click the **Settings** icon (⚙️)
   - Navigate to **Outlook Integration** section
   - Click **Connect Outlook**
   - Authorize AICA to access your Outlook account
   - Generate an email and click **Send via Outlook**
