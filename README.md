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
- [Our Team](https://github.com/Etown-CS170/2025-AICA/wiki/Our-Team) - Meet the developers behind AICA

---

## 🚀 Quick Start

### Navigate to project folder
```bash
cd 2025-AICA
```

### Install all dependencies
```bash
npm run install:all
```

### Set up environment variables

**Backend** - Create `backend/.env`:
```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=https://aica-backend-api

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

**Frontend** - Update `frontend/src/environments/environment.ts`:
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
    }
  }
};
```

Get your API keys:
- **OpenAI API Key** from the [OpenAI Dashboard](https://platform.openai.com/api-keys)
- **Auth0 Credentials** from the [Auth0 Dashboard](https://manage.auth0.com/)

⚠️ **Never commit your `.env` file or API keys to version control!**

### Start development servers
```bash
npm run dev
```

This will start both the backend (http://localhost:3000) and frontend (http://localhost:4200) concurrently.

---

## 🛠️ Alternative Setup

### Backend only
```bash
cd backend
```
```bash
npm install
```
```bash
npm run dev
```

### Frontend only
```bash
cd frontend
```
```bash
npm install
```
```bash
npm start
```
