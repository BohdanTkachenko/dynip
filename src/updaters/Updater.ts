import { IPv4Address, IPv6Address } from '../util/IPAddress';
import { Logger } from '../util/Logger';

export type UpdateRecordEntry = {
  type: 'v4' | 'v6';
  hostname: string;
};

export class Updater {
  updateRecords: UpdateRecordEntry[];
  logger: Logger;

  constructor(updateRecords: UpdateRecordEntry[], logger: Logger) {
    this.updateRecords = updateRecords;
    this.logger = logger;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(ipv4: IPv4Address | null, ipv6: IPv6Address | null): Promise<null> {
    throw new Error('update is not implemented');
  }
}
