// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  auth0: {
    domain: 'dev-c8488bb6p3agyt65.us.auth0.com',
    clientId: 'mGp3vnXF3Qijavt7Yem4gofbnnjek99I',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://aica-backend-api'
    },
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true
  }
};