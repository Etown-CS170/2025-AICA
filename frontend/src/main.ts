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
      ...environment.auth0,
      httpInterceptor: {
        allowedList: [
          'http://localhost:3000/api/*',  // Match ALL api endpoints
          {
            uri: 'http://localhost:3000/api/*',
            tokenOptions: {
              authorizationParams: {
                audience: 'https://dev-c8488bb6p3agyt65.us.auth0.com/api/v2/'
              }
            }
          }
        ]
      }
    })
  ]
}).catch(err => console.error(err));