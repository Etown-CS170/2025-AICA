import { Routes } from '@angular/router';
import { OutlookCallbackComponent } from './components/outlook-callback.component';

export const routes: Routes = [
  {
    path: 'outlook/callback',
    component: OutlookCallbackComponent
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ''
  }
];