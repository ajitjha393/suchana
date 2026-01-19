import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { LoggerService } from '../logging/logger.service';

describe('HttpLoggingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  let logger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: LoggerService, useValue: logger },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpLoggingInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add x-correlation-id header to outgoing requests', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');

    const corr = req.request.headers.get('x-correlation-id');
    expect(corr).toBeTruthy();
    expect(typeof corr).toBe('string');
    expect((corr ?? '').length).toBeGreaterThan(5);

    req.flush({ ok: true });
  });

  it('should not log errors on successful response', () => {
    http.get('/api/success').subscribe();

    const req = httpMock.expectOne('/api/success');
    req.flush({ ok: true });

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log HttpErrorResponse with request metadata and correlationId, then rethrow', (done) => {
    http.get('/api/fail').subscribe({
      next: () => fail('Expected error, got success'),
      error: (err) => {
        // rethrow check
        expect(err instanceof HttpErrorResponse).toBeTrue();
        expect((err as HttpErrorResponse).status).toBe(500);

        // logger call check
        expect(logger.error).toHaveBeenCalledTimes(1);

        const call = logger.error.calls.mostRecent();
        const [message, loggedErr, context, extra] = call.args as any[];

        expect(message).toBe('HTTP request failed');
        expect(loggedErr instanceof HttpErrorResponse).toBeTrue();

        // context has correlationId
        expect(context).toEqual(
          jasmine.objectContaining({
            feature: 'http',
            action: 'request',
            correlationId: jasmine.any(String),
          })
        );
        expect((context.correlationId as string).length).toBeGreaterThan(5);

        // extra has request details
        expect(extra).toEqual(
          jasmine.objectContaining({
            method: 'GET',
            url: '/api/fail',
            status: 500,
            durationMs: jasmine.any(Number),
            response: jasmine.anything(),
          })
        );

        done();
      },
    });

    const req = httpMock.expectOne('/api/fail');
    req.flush(
      { message: 'nope' },
      { status: 500, statusText: 'Server Error' }
    );
  });

  it('should include response body in logger extra.response for HttpErrorResponse', (done) => {
    const body = { code: 'X', detail: 'bad' };

    http.post('/api/fail-body', { a: 1 }).subscribe({
      next: () => fail('Expected error'),
      error: () => {
        const [_, __, ___, extra] = logger.error.calls.mostRecent().args as any[];
        expect(extra.response).toEqual(body);
        done();
      },
    });

    const req = httpMock.expectOne('/api/fail-body');
    req.flush(body, { status: 400, statusText: 'Bad Request' });
  });

  it('should log unknown (non-HttpErrorResponse) errors and rethrow', (done) => {
    http.get('/api/unknown-error').subscribe({
      next: () => fail('Expected error'),
      error: (err) => {
        expect(err).toBeTruthy();
        expect(logger.error).toHaveBeenCalledTimes(1);

        const call = logger.error.calls.mostRecent();
        const [message, loggedErr, context, extra] = call.args as any[];

        expect(message).toBe('HTTP request failed');
        expect(loggedErr).toEqual(jasmine.anything());

        expect(context).toEqual(
          jasmine.objectContaining({
            feature: 'http',
            action: 'request',
            correlationId: jasmine.any(String),
          })
        );

        expect(extra).toEqual(
          jasmine.objectContaining({
            method: 'GET',
            url: '/api/unknown-error',
            durationMs: jasmine.any(Number),
          })
        );

        done();
      },
    });

    const req = httpMock.expectOne('/api/unknown-error');

    // Force a non-HttpErrorResponse error from the backend
    req.error(new ProgressEvent('error') as any);
  });

  it('should preserve the correlation id per request (header exists on every request)', () => {
    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();

    const reqA = httpMock.expectOne('/api/a');
    const reqB = httpMock.expectOne('/api/b');

    const corrA = reqA.request.headers.get('x-correlation-id');
    const corrB = reqB.request.headers.get('x-correlation-id');

    expect(corrA).toBeTruthy();
    expect(corrB).toBeTruthy();

    reqA.flush({ ok: true });
    reqB.flush({ ok: true });
  });
});
