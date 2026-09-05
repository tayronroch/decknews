export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug(_message: string, _context?: Record<string, unknown>): void
  info(_message: string, _context?: Record<string, unknown>): void
  warn(_message: string, _context?: Record<string, unknown>): void
  error(_message: string, _context?: Record<string, unknown>): void
}

export class ConsoleLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, context ?? '')
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, context ?? '')
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context ?? '')
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, context ?? '')
  }
}

export const logger = new ConsoleLogger()
