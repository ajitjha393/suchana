import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';

function simpleId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

@Injectable()
export class HttpLoggingInterceptor implements HttpInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const correlationId = simpleId();
    const started = performance.now();

    const cloned = req.clone({
      setHeaders: { 'x-correlation-id': correlationId },
    });

    return next.handle(cloned).pipe(
      tap((evt) => {
        if (evt instanceof HttpResponse) {
          // optional: We should log only slow requests
          // if (ms > 1200) this.logger.warn('Slow API request', { feature: 'http', action: 'slow', correlationId }, { url: req.url, ms });
        }
      }),
      catchError((err: unknown) => {
        const ms = Math.round(performance.now() - started);

        if (err instanceof HttpErrorResponse) {
          this.logger.error(
            'HTTP request failed',
            err,
            {
              feature: 'http',
              action: 'request',
              correlationId,
            },
            {
              method: req.method,
              url: req.url,
              status: err.status,
              durationMs: ms,
              // keep response body small-ish
              response: err.error,
            }
          );
        } else {
          this.logger.error(
            'HTTP request failed (unknown error)',
            err,
            { feature: 'http', action: 'request', correlationId },
            { method: req.method, url: req.url, durationMs: ms }
          );
        }

        return throwError(() => err);
      }),
      finalize(() => {
        // If we want: log success durations for observability
        // const ms = Math.round(performance.now() - started);
      })
    );
  }
}
