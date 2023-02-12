import { pino, Logger as PinoLogger } from 'pino';
import util from 'node:util';

export class Logger {
  prefix: string | null;
  logger: PinoLogger;

  constructor(prefix: string | null) {
    this.prefix = prefix;
    this.logger = pino();
  }

  getPrefix() {
    if (!this.prefix) {
      return null;
    }
    return `[${this.prefix}] `;
  }

  stringifyArgs(...args: unknown[]): string {
    const strArgs = args.map((arg) =>
      typeof arg === 'string' ? arg.trim() : util.inspect(arg),
    );
    const prefix = this.getPrefix();
    if (prefix) {
      strArgs.unshift(prefix);
    }
    return strArgs.join(' ');
  }

  child(prefix: string): Logger {
    return new Logger(
      [this.prefix, prefix]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(' '),
    );
  }

  info(...args: unknown[]) {
    this.logger.info(this.stringifyArgs(...args));
  }

  debug(...args: unknown[]) {
    this.logger.debug(this.stringifyArgs(...args));
  }

  trace(...args: unknown[]) {
    this.logger.trace(this.stringifyArgs(...args));
  }
}
