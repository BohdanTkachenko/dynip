import { IPAddress, IPv4Address, IPv6Address } from '../util/IPAddress';
import { Updater, UpdateRecordEntry } from './Updater';
import axios, { AxiosError, AxiosInstance, AxiosResponse, Method } from 'axios';
import { Logger } from '../util/Logger';

export type CloudflareUpdaterConfig = {
  apiKey: string;
};

type ZoneInfo = { id: string; name: string };
type DnsRecord = {
  id: string;
  type: string;
  name: string;
};
type ZoneInfoWithRecords = ZoneInfo & { dnsRecords: DnsRecord[] };
type ZoneIdRecordId = {
  zoneId: string;
  name: string;
  recordId: string | null;
};

export class CloudflareUpdater extends Updater {
  api: AxiosInstance;
  ipv4UpdateRecords: ZoneIdRecordId[] = [];
  ipv6UpdateRecords: ZoneIdRecordId[] = [];

  constructor(
    updateRecords: UpdateRecordEntry[],
    config: CloudflareUpdaterConfig,
    logger: Logger,
  ) {
    super(updateRecords, logger);
    this.api = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
    this.logger.debug(
      'Initialized CloudflareUpdater with updateRecords:',
      updateRecords,
    );
  }

  async update(
    ipv4: IPv4Address | null,
    ipv6: IPv6Address | null,
  ): Promise<null> {
    await this.init();
    if (ipv4) {
      await this.updateOrCreateRecords(ipv4, this.ipv4UpdateRecords);
    }
    if (ipv6) {
      await this.updateOrCreateRecords(ipv6, this.ipv6UpdateRecords);
    }
    return null;
  }

  async init() {
    this.ipv4UpdateRecords = [];
    this.ipv6UpdateRecords = [];
    const zones = await this.getZones();
    for (const record of this.updateRecords) {
      const out =
        record.type == 'v4' ? this.ipv4UpdateRecords : this.ipv6UpdateRecords;
      const ids = CloudflareUpdater.findZoneIdAndRecordIdForHostname(
        record,
        zones,
      );
      if (ids && ids?.zoneId) {
        out.push({
          zoneId: ids.zoneId,
          name: record.hostname,
          recordId: ids.recordId ? ids.recordId : '',
        });
      }
    }
    this.logger.debug(
      'Initialized IPv4 records to update: ',
      this.ipv4UpdateRecords,
    );
    this.logger.debug(
      'Initialized IPv6 records to update: ',
      this.ipv6UpdateRecords,
    );
  }

  async getZones(): Promise<ZoneInfoWithRecords[]> {
    const zonesInfo: ZoneInfo[] = await this.request('GET', 'zones');
    const zones: ZoneInfoWithRecords[] = [];
    for (const zoneInfo of zonesInfo) {
      const dnsRecords: DnsRecord[] = await this.request(
        'GET',
        `zones/${zoneInfo.id}/dns_records`,
      );
      zones.push({
        id: zoneInfo.id,
        name: zoneInfo.name,
        dnsRecords,
      });
    }
    this.logger.trace('Loaded zones:', zones);
    return zones;
  }

  async updateOrCreateRecords(ip: IPAddress, records: ZoneIdRecordId[]) {
    this.logger.debug(
      `Update or create records for IP ${ip.toString()}`,
      records,
    );
    for (const record of records) {
      if (record.recordId) {
        record.recordId = await this.updateRecord(
          record.zoneId,
          record.recordId,
          ip,
        );
      } else {
        record.recordId = await this.createRecord(
          record.zoneId,
          record.name,
          ip,
        );
      }
    }
  }

  async createRecord(zoneId: string, name: string, ip: IPAddress) {
    this.logger.info(
      `Create record ${name} for IP ${ip.toString()} in zone with ID ${zoneId}`,
    );
    const res = await this.request('POST', `zones/${zoneId}/dns_records`, {
      type: ip.type == 'v4' ? 'A' : 'AAAA',
      name,
      content: ip.toString(),
    });
    this.logger.trace('Create record response:', res);
    return res.id;
  }

  async updateRecord(
    zoneId: string,
    recordId: string,
    ip: IPAddress,
  ): Promise<string> {
    this.logger.info(
      `Update record ${recordId} for IP ${ip.toString()} in zone with ID ${zoneId}`,
    );
    const res = await this.request(
      'PATCH',
      `zones/${zoneId}/dns_records/${recordId}`,
      { content: ip.toString() },
    );
    this.logger.trace('Update record response:', res);
    return res.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request(method: Method, path: string, data?: object): Promise<any> {
    let res: AxiosResponse;
    try {
      res = await this.api.request({
        method,
        url: path,
        data,
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        res = err.response;
      } else {
        throw err;
      }
    }
    if (res.data.errors.length) {
      const errors: string[] = res.data.errors.map(
        (err: { code: number; message: string }) =>
          `${err.code}: ${err.message}`,
      );
      throw new Error(errors.join('; '));
    }
    return res.data.result;
  }

  static convertIpTypeToDnsType(ipType: 'v4' | 'v6'): 'A' | 'AAAA' | null {
    if (ipType == 'v4') {
      return 'A';
    }
    if (ipType == 'v6') {
      return 'AAAA';
    }
    return null;
  }

  static findZoneIdAndRecordIdForHostname(
    record: UpdateRecordEntry,
    zones: ZoneInfoWithRecords[],
  ): { zoneId: string; recordId: string | null } | null {
    for (const zone of zones) {
      for (const dnsRecord of zone.dnsRecords) {
        if (
          dnsRecord.type ==
            CloudflareUpdater.convertIpTypeToDnsType(record.type) &&
          dnsRecord.name == record.hostname
        ) {
          return { zoneId: zone.id, recordId: dnsRecord.id };
        }
      }
      if (
        zone.name == record.hostname ||
        record.hostname.endsWith(`.${zone.name}`)
      ) {
        return { zoneId: zone.id, recordId: null };
      }
    }
    return null;
  }
}
