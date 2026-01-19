import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    const logger = this.injector.get(LoggerService);

    logger.error(
      'Unhandled application error',
      error,
      { feature: 'app', action: 'unhandled' }
    );

    // Keep default behavior (so it still shows in console and Angular dev overlay)
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
