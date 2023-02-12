const ipv4RegExp = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
const ipv6RegExp =
  /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

export class IPAddress {
  type: 'v4' | 'v6';
  ip: string;

  constructor(type: 'v4' | 'v6', ip: string) {
    this.type = type;
    this.ip = ip.trim();
  }

  equals(other: IPAddress | null) {
    if (!other) {
      return false;
    }
    return this.type == other.type && this.ip == other.ip;
  }

  toString(): string {
    return this.ip;
  }
}

/**
 * Wrapper around IPv4 address string that validates the IP address can can be
 * passed around.
 */
export class IPv4Address extends IPAddress {
  constructor(ip: string) {
    super('v4', ip);
    if (!ipv4RegExp.test(this.ip)) {
      throw new Error(`'${this.ip}' is not a valid IPv4 address.`);
    }
  }
}

/**
 * Wrapper around IPv4 address string that validates the IP address can can be
 * passed around.
 */
export class IPv6Address extends IPAddress {
  constructor(ip: string) {
    super('v6', ip);
    if (!ipv6RegExp.test(this.ip)) {
      throw new Error(`'${this.ip}' is not a valid IPv6 address.`);
    }
  }
}
