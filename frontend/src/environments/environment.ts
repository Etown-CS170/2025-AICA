export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  auth0: {
    domain: 'your-tenant.us.auth0.com',
    clientId: 'YOUR_AUTH0_CLIENT_ID',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://your-tenant.us.auth0.com/api/v2/'
    }
  }
};