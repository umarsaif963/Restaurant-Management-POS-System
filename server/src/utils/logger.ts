type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const COLOR: Record<LogLevel, string> = {
  debug: '90',
  info: '36',
  warn: '33',
  error: '31',
};

function write(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `\x1b[${COLOR[level]}m[${level.toUpperCase()}]\x1b[0m`;
  const line = `${prefix} ${timestamp} ${message}`;
  // eslint-disable-next-line no-console
  console[level](line, meta === undefined ? '' : meta);
}

export const logger = {
  debug: (message: string, meta?: unknown): void => write('debug', message, meta),
  info: (message: string, meta?: unknown): void => write('info', message, meta),
  warn: (message: string, meta?: unknown): void => write('warn', message, meta),
  error: (message: string, meta?: unknown): void => write('error', message, meta),
};