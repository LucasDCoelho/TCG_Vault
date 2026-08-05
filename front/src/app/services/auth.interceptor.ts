import { HttpInterceptorFn } from '@angular/common/http';

export const TOKEN_KEY = 'tcg_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const clone = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(clone);
};
