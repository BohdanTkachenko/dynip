import minimist from 'minimist';
import yaml = require('js-yaml');
import { promises as fs } from 'fs';
import { Worker, WorkerConfig } from './Worker';
import { Logger } from './util/Logger';
import camelize = require('camelize');

export type Config = {
  logLevel: 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  workers: WorkerConfig[];
};

async function loadConfig(configPath: string): Promise<Config> {
  const configData = await fs.readFile(configPath);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = yaml.load(configData.toString());
  // Convert snake_case keys used in YAML into camelCase.
  return camelize(config);
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const configPath = argv.config || argv.c;
  if (!configPath) {
    throw new Error(
      `Usage: ${process.argv[0]} ${process.argv[1]} -c path/to/config.yaml`,
    );
  }
  const config = await loadConfig(configPath);
  const logger = new Logger(null);
  logger.logger.level = config.logLevel || 'info';
  if (config.workers) {
    let id = 1;
    for (const workerConfig of config.workers) {
      const worker = new Worker(workerConfig, logger.child(`Worker ${id}`));
      worker.start();
      id++;
    }
  }
}

main().catch((e: Error) => {
  console.error(e.stack);
  process.exit(1);
});
