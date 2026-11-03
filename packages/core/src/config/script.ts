import { ScriptId } from '../types';
import { SporeConfig, SporeScript, SporeScriptCategory } from './types';
import { getSporeConfigCache, getSporeCacheScriptsByTags } from './cache';

/**
 * Get a specific SporeScriptCategory from SporeConfig by "scriptName".
 * Throws an error if the script doesn't exist.
 */
export function getSporeScriptCategory(config: SporeConfig, scriptName: string): SporeScriptCategory {
  const category = config.scripts[scriptName];
  if (!category) {
    throw new Error(`"${scriptName}" script is not defined in the SporeConfig`);
  }

  return category;
}

/**
 * Get a specific SporeScript from SporeConfig by "scriptName" with optional "scriptId" or "tags".
 * Throws an error if the script doesn't exist.
 */
export function getSporeScript(config: SporeConfig, scriptName: string): SporeScript;
export function getSporeScript(config: SporeConfig, scriptName: string, tags: string[]): SporeScript;
export function getSporeScript(config: SporeConfig, scriptName: string, scriptId: ScriptId): SporeScript;
export function getSporeScript(config: SporeConfig, scriptName: string, extraArg?: unknown): SporeScript {
  if (extraArg && typeof extraArg === 'object' && 'codeHash' in extraArg && 'hashType' in extraArg) {
    return getSporeScriptByScriptId(config, scriptName, extraArg as ScriptId);
  }
  if (extraArg && Array.isArray(extraArg)) {
    return getSporeScriptByTags(config, scriptName, extraArg as string[]);
  }
  if (config.defaultTags) {
    return getSporeScriptByTags(config, scriptName, config.defaultTags);
  }

  return getLatestSporeScript(config, scriptName);
}

/**
 * Get a specific SporeScript from SporeConfig by "scriptName".
 * Throws an error if the script doesn't exist.
 */
export function getLatestSporeScript(config: SporeConfig, scriptName: string): SporeScript {
  const scriptCategory = config.scripts[scriptName];
  if (!scriptCategory || !scriptCategory.versions.length) {
    throw new Error(`"${scriptName}" script is not defined in the SporeConfig`);
  }

  return scriptCategory.versions[0];
}

/**
 * Get a specific SporeScript from SporeConfig by "scriptName" and "scriptId".
 * Throws an error if the script doesn't exist.
 */
export function getSporeScriptByScriptId(config: SporeConfig, scriptName: string, scriptId: ScriptId) {
  const scriptCategory = config.scripts[scriptName];
  if (!scriptCategory || !scriptCategory.versions.length) {
    throw new Error(`"${scriptName}" script is not defined in the SporeConfig`);
  }

  const script = config.scripts[scriptName]?.versions.find(
    (item) => item.script.codeHash === scriptId.codeHash && item.script.hashType === scriptId.hashType,
  );
  if (!script) {
    throw new Error(
      `Specific "${scriptName}" script is not defined in the SporeConfig, codeHash: ${scriptId.codeHash}`,
    );
  }

  return script;
}

/**
 * Get a specific SporeScript from SporeConfig by "scriptName" and "scriptId".
 * Throws an error if the script doesn't exist.
 */
export function getSporeScriptByTags(config: SporeConfig, scriptName: string, tags: string[]): SporeScript {
  const scriptCategory = config.scripts[scriptName];
  if (!scriptCategory || !scriptCategory.versions.length) {
    throw new Error(`"${scriptName}" script is not defined in the SporeConfig`);
  }

  const cache = getSporeConfigCache(config);
  const scripts = getSporeCacheScriptsByTags(cache, scriptName, tags);
  if (!scripts || !scripts.length) {
    throw new Error(
      `Specific tags of the "${scriptName}" script is not defined in the SporeConfig: [${tags.join(', ')}]`,
    );
  }

  // Returns the latest version of the script (the first one in the list)
  return scripts[0];
}

/**
 * Returns a boolean indicating weather if the target ScriptName exists in the SporeConfig.
 */
export function isSporeScriptCategorySupported(config: SporeConfig, scriptName: string): boolean {
  return config.scripts[scriptName] !== void 0;
}

/**
 * Returns a boolean indicating weather if the target ScriptId exists in the SporeConfig.
 * If "scriptName" is passed, it also checks whether the name of the target script matches.
 */
export function isSporeScriptSupported(config: SporeConfig, scriptId: ScriptId, scriptName?: string): boolean {
  return Object.entries(config.scripts).some(
    ([name, category]) =>
      (!scriptName || name === scriptName) &&
      category.versions.some(
        (item) => item.script.codeHash === scriptId.codeHash && item.script.hashType === scriptId.hashType,
      ),
  );
}
