import { CNftConfig } from './types';

/**
 * Get a specific Script from CNftConfig,
 * and throws an error if the script doesn't exist.
 */
export function getCNftConfigScript(config: CNftConfig, scriptName: string) {
  const script = config.scripts[scriptName];
  if (!script) {
    throw new Error(`${scriptName} script not defined in CNftConfig`);
  }

  return script;
}
