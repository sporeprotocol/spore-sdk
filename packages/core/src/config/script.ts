import { ScriptId } from '../types';
import { SporeConfig, SporeScript, SporeScriptCategory } from './types';
import { getSporeConfigCache, getSporeCacheScriptByCodeHash } from './cache';

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
 * Get a specific SporeScript from SporeConfig by "scriptName" and or "scriptId".
 * Throws an error if the script doesn't exist.
 */
export function getSporeScript(config: SporeConfig, scriptName: string, scriptId?: ScriptId): SporeScript {
  const scriptCategory = config.scripts[scriptName];
  if (!scriptCategory || !scriptCategory.versions.length) {
    throw new Error(`"${scriptName}" script is not defined in the SporeConfig`);
  }

  const cache = getSporeConfigCache(config);

  // Find a specific version of the script
  if (scriptId) {
    const script = getSporeCacheScriptByCodeHash(cache, scriptId.codeHash, scriptName);
    if (!script) {
      throw new Error(`Specific version of the "${scriptName}" script is not defined in the SporeConfig`);
    }

    return script;
  }

  // Returns the latest version of the script
  return scriptCategory.versions[0];
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
  const cache = getSporeConfigCache(config);
  const script = getSporeCacheScriptByCodeHash(cache, scriptId.codeHash, scriptName);
  return script !== void 0;
}
