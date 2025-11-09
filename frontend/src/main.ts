// frontend/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { authHttpInterceptorFn } from '@auth0/auth0-angular';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([authHttpInterceptorFn])
    ),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: environment.auth0.authorizationParams.redirect_uri,
        audience: environment.auth0.authorizationParams.audience
      },
      httpInterceptor: {
        allowedList: ['http://localhost:3000/api/email/generate']
      }
    })
  ]
}).catch(err => console.error(err));