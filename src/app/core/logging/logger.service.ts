import { Injectable } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  feature?: string;     // 'notifications'
  component?: string;   // 'NotificationsPageComponent'
  action?: string;      // 'bulkDelete'
  correlationId?: string;
  extra?: Record<string, unknown>;
}

export interface LogEvent {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  data?: unknown;
  error?: unknown;
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  // Later you can route this to a backend endpoint or Sentry
  // For now we keep it simple: console + in-memory buffer.

  private readonly buffer: LogEvent[] = [];
  private readonly maxBuffer = 200;

  debug(message: string, context?: LogContext, data?: unknown): void {
    this.write('debug', message, context, data);
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    this.write('info', message, context, data);
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    this.write('warn', message, context, data);
  }

  error(message: string, error?: unknown, context?: LogContext, data?: unknown): void {
    this.write('error', message, context, data, error);
  }

  getBuffer(): LogEvent[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer.length = 0;
  }

  private write(level: LogLevel, message: string, context?: LogContext, data?: unknown, error?: unknown): void {
    const evt: LogEvent = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
      error: this.sanitizeError(error),
    };

    this.buffer.push(evt);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();

    // Console output (structured)
    const tag = context?.component || context?.feature || 'app';
    const prefix = `[${evt.timestamp}] [${level.toUpperCase()}] [${tag}] ${message}`;

    // eslint-disable-next-line no-console
    if (level === 'error') console.error(prefix, { context, data, error: evt.error });
    else if (level === 'warn') console.warn(prefix, { context, data });
    else console.log(prefix, { context, data });
  }

  private sanitizeError(err: unknown): unknown {
    if (!err) return undefined;
    // Avoid circular structures; keep it safe.
    if (err instanceof Error) {
      return { name: err.name, message: err.message, stack: err.stack };
    }
    return err;
  }
}
