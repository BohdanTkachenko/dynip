import { IPv4Address, IPv6Address } from '../util/IPAddress';
import { Logger } from '../util/Logger';

export type ResolverResult = {
  ipv4: IPv4Address | null;
  ipv6: IPv6Address | null;
};

export class Resolver {
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  resolve(): Promise<ResolverResult> {
    throw new Error('resolve is not implemented');
  }
}
