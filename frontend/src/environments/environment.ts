export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  auth0: {
    domain: 'dev-c8488bb6p3agyt65.us.auth0.com',
    clientId: 'mGp3vnXF3Qijavt7Yem4gofbnnjek99I',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://aica-backend-api',
      scope: 'openid profile email offline_access'
    },
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true
  },
  microsoft: {
    clientId: 'cdcbfa76-5d81-44d6-9782-01ba25748f5e',
    redirectUri: 'http://localhost:4200/outlook/callback',
    tenantId: 'common'
  }
};