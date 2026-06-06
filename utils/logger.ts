enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    const env = process.env.NODE_ENV || 'development';
    this.currentLevel = env === 'production' ? LogLevel.ERROR : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level} ${contextStr} ${message}`;
  }

  debug(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context), ...args);
    }
  }

  info(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context), ...args);
    }
  }

  warn(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context), ...args);
    }
  }

  error(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context), ...args);
    }
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }
}

export const logger = new Logger();
export default logger;
