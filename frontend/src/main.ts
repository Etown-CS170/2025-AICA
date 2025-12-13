import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: environment.auth0.authorizationParams,
      cacheLocation: environment.auth0.cacheLocation,
      useRefreshTokens: environment.auth0.useRefreshTokens,
      skipRedirectCallback: (window.location.pathname === '/outlook/callback'),
      httpInterceptor: {
        allowedList: [
          'http://localhost:3000/api/*'
        ]
      }
    }),
    provideRouter(routes)
  ]
}).catch(() => console.error('⚠️ Application failed to start'));