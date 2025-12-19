import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// Interceptor to add X-User-Id header to all requests
function userIdInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.id) {
        const clonedReq = req.clone({
          setHeaders: { 'X-User-Id': user.id.toString() }
        });
        return next(clonedReq);
      }
    } catch (e) {}
  }
  return next(req);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([userIdInterceptor]))
  ]
};
