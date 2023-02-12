import { Updater, UpdateRecordEntry } from './Updater';
import {
  CloudflareUpdater,
  CloudflareUpdaterConfig,
} from './CloudflareUpdater';
import { Logger } from '../util/Logger';

export type UpdaterConfig = {
  type: 'cloudflare';
  config: CloudflareUpdaterConfig;
  updateRecords: UpdateRecordEntry[];
};

export function getUpdater(config: UpdaterConfig, logger: Logger): Updater {
  logger.debug(
    `Initializing resolver of type ${config.type} with config:`,
    config.config,
  );
  switch (config.type) {
    case 'cloudflare':
      return new CloudflareUpdater(config.updateRecords, config.config, logger);
    default:
  }
  throw new Error(`Unknown updater "${config.type}.`);
}
