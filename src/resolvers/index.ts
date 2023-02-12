import { Resolver } from './Resolver';
import { WebResolver, WebResolverConfig } from './WebResolver';
import { Logger } from '../util/Logger';

export type ResolverConfig = {
  type: 'web';
  config: WebResolverConfig;
};

export function getResolver(config: ResolverConfig, logger: Logger): Resolver {
  logger.debug(
    `Initializing resolver of type ${config.type} with config:`,
    config.config,
  );
  switch (config.type) {
    case 'web':
      return new WebResolver(config.config, logger);
    default:
  }
  throw new Error(`Unknown resolver "${config.type}.`);
}
