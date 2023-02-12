import { Resolver, ResolverResult } from './Resolver';
import { IPv4Address, IPv6Address } from '../util/IPAddress';
import { Logger } from '../util/Logger';
import xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import axios, { AxiosRequestConfig } from 'axios';

export type XpathParserConfig = {
  selector: string;
};

export type ParserConfig = {
  type: 'xpath';
  config: XpathParserConfig;
};

export type WebResolverConfig = {
  request: AxiosRequestConfig;
  ipv4Parser: ParserConfig;
  ipv6Parser: ParserConfig;
};

export class WebResolver extends Resolver {
  config: WebResolverConfig;

  constructor(config: WebResolverConfig, logger: Logger) {
    super(logger);
    if (!config.ipv4Parser && !config.ipv6Parser) {
      throw new Error(
        'WebResolverConfig must provide configuration for IPv4, IPv6 or both.',
      );
    }
    this.config = config;
    this.logger.debug('Initialized WebResolver with config:', config);
  }

  async resolve(): Promise<ResolverResult> {
    this.logger.debug(
      'Making fetch request with options: ',
      this.config.request,
    );
    const res = await axios(this.config.request);
    this.logger.debug('Got response with status code', res.status);
    this.logger.trace('Response data:', res.data);
    const result: ResolverResult = { ipv4: null, ipv6: null };
    if (this.config.ipv4Parser) {
      const address = this.parse(res.data, this.config.ipv4Parser);
      if (address) {
        result.ipv4 = new IPv4Address(address);
        this.logger.debug('Resolved IPv4 address:', address);
      }
    }
    if (this.config.ipv6Parser) {
      const address = this.parse(res.data, this.config.ipv6Parser);
      if (address) {
        result.ipv6 = new IPv6Address(address);
        this.logger.debug('Resolved IPv6 address:', address);
      }
    }
    return result;
  }

  parse(data: string, parser: ParserConfig): string | null {
    switch (parser.type) {
      case 'xpath':
        return this.parseXpath(data, parser.config);
      default:
    }
    throw new Error(`Unknown web parser '${parser.type}'.`);
  }

  parseXpath(data: string, config: XpathParserConfig): string | null {
    const node = xpath.parse(config.selector).select1({
      node: new DOMParser().parseFromString(data, 'text/html'),
      isHtml: true,
    });
    if (!node || !node.firstChild) {
      return null;
    }
    return node.firstChild.toString();
  }
}
