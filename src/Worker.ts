import { getResolver, ResolverConfig } from './resolvers';
import { Resolver, ResolverResult } from './resolvers/Resolver';
import { getUpdater, UpdaterConfig } from './updaters';
import { Updater } from './updaters/Updater';
import { IPv4Address, IPv6Address } from './util/IPAddress';
import { Logger } from './util/Logger';

export type WorkerConfig = {
  // Number of seconds between updates.
  interval: number;
  // If true, will always call updaters, even if IP has not changed.
  force: boolean;
  // If multiple resolvers are specified, it will go through each of them until
  // it can resolve both IPv4 and IPv6. It will not override previous results.
  resolvers: ResolverConfig[];
  updaters: UpdaterConfig[];
};

export class Worker {
  logger: Logger;
  config: WorkerConfig;
  resolvers: Resolver[];
  updaters: Updater[];
  ipv4: IPv4Address | null = null;
  ipv6: IPv6Address | null = null;

  constructor(config: WorkerConfig, logger: Logger) {
    if (isNaN(config.interval) || !config.interval) {
      throw new Error(`Invalid worker interval: ${config.interval}`);
    }
    this.logger = logger;
    this.config = config;
    this.resolvers = [];
    this.updaters = [];
    let resolverId = 1;
    for (const resolverConfig of config.resolvers) {
      this.resolvers.push(
        getResolver(
          resolverConfig,
          this.logger.child(`Resolver #${resolverId}]`),
        ),
      );
      resolverId++;
    }
    let updaterId = 1;
    for (const updaterConfig of config.updaters) {
      this.updaters.push(
        getUpdater(updaterConfig, this.logger.child(`Updater #${updaterId}`)),
      );
      updaterId++;
    }
  }

  async start() {
    this.logger.info('Started.');
    await this.update();
    setInterval(() => this.update(), this.config.interval * 1000);
  }

  async update() {
    this.logger.debug('Updating...');
    const result: ResolverResult = { ipv4: null, ipv6: null };
    for (const resolver of this.resolvers) {
      const resolved = await resolver.resolve();
      if (!result.ipv4) {
        result.ipv4 = resolved.ipv4;
      }
      if (!result.ipv6) {
        result.ipv6 = resolved.ipv6;
      }
      if (result.ipv4 && result.ipv6) {
        this.logger.debug('Found both IPv4 and IPv6.');
        break;
      }
    }

    const updateIPv4 =
      !this.ipv4 || !this.ipv4.equals(result.ipv4) ? result.ipv4 : null;
    if (updateIPv4) {
      this.logger.info(
        `IPv4 changed ${
          this.ipv4?.toString() || '<none>'
        } -> ${updateIPv4.toString()}`,
      );
      this.ipv4 = result.ipv4;
    }
    const updateIPv6 =
      !this.ipv6 || !this.ipv6.equals(result.ipv6) ? result.ipv6 : null;
    if (updateIPv6) {
      this.logger.info(
        `IPv6 changed ${
          this.ipv6?.toString() || '<none>'
        } -> ${updateIPv6.toString()}`,
      );
      this.ipv6 = result.ipv6;
    }
    for (const updater of this.updaters) {
      if (this.config.force) {
        await updater.update(this.ipv4, this.ipv6);
      } else {
        await updater.update(updateIPv4, updateIPv6);
      }
    }
  }
}
