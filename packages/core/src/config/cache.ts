import cloneDeep from 'lodash/cloneDeep';
import { Hash } from '@ckb-lumos/base';
import { getSporeConfigHash } from './hash';
import { SporeConfig, SporeScript } from './types';

const cacheStore: Map<Hash, SporeConfigCache> = new Map();

export interface SporeConfigCache<T extends string = string> {
  hash: Hash;
  config: SporeConfig<T>;
  scriptsByTag: Record<T, Record<string, SporeScript[]>>;
  scriptsByCodeHash: Record<Hash, SporeCategorizedScript>;
}

export interface SporeCategorizedScript extends SporeScript {
  name: string;
}

/**
 * Create a SporeCache from SporeConfig and store in cache.
 */
export function setSporeConfigCache<T extends string>(config: SporeConfig<T>): void {
  const cache = createSporeConfigCache<T>(config);
  cacheStore.set(cache.hash, cache);
}

/**
 * Get a SporeConfig's corresponding SporeCache.
 * If not exists, create one and store in cache, and then return the new SporeCache.
 */
export function getSporeConfigCache<T extends string>(config: SporeConfig<T>): SporeConfigCache<T> {
  const hash = getSporeConfigHash(config);
  if (cacheStore.has(hash)) {
    return cacheStore.get(hash) as SporeConfigCache<T>;
  }

  setSporeConfigCache(config);
  return cacheStore.get(hash) as SporeConfigCache<T>;
}

/**
 * Create a SporeConfigCache from SporeConfig.
 * Will generate mapping info for the scripts to save time when searching.
 */
export function createSporeConfigCache<T extends string>(config: SporeConfig<T>): SporeConfigCache<T> {
  const hash = getSporeConfigHash(config);

  const scriptsByTag = {} as Record<T, Record<string, SporeScript[]>>;
  const scriptsByCodeHash = {} as Record<Hash, SporeCategorizedScript>;

  for (const scriptName in config.scripts) {
    const scriptCategory = config.scripts[scriptName];
    const scriptTagMap = {} as Record<string, SporeScript[]>;

    for (const script of scriptCategory.versions) {
      scriptsByCodeHash[script.script.codeHash] = {
        name: scriptName,
        ...cloneDeep(script),
      };
      for (const tag of script.tags) {
        if (scriptTagMap[tag] === void 0) scriptTagMap[tag] = [];
        scriptTagMap[tag].push(script);
      }
    }

    scriptsByTag[scriptName] = scriptTagMap;
  }

  return {
    hash,
    config,
    scriptsByTag,
    scriptsByCodeHash,
  };
}

/**
 * Search for a specific list of SporeScripts by "scriptName" and "tag" in a SporeCache.
 */
export function getSporeCacheScriptsByTag<T extends string>(
  cache: SporeConfigCache<T>,
  scriptName: T,
  tag: string,
): SporeScript[] | undefined {
  const scripts = cache.scriptsByTag[scriptName]?.[tag];
  if (!Array.isArray(scripts)) {
    return void 0;
  }

  return scripts;
}

/**
 * Search for a specific SporeScript by "codeHash" in a SporeCache.
 * If "scriptName" is passed, it also checks whether the name of the target script matches.
 */
export function getSporeCacheScriptByCodeHash<T extends string>(
  cache: SporeConfigCache<T>,
  codeHash: Hash,
  scriptName?: T,
) {
  const script = cache.scriptsByCodeHash[codeHash];
  if (scriptName && script.name !== scriptName) {
    return void 0;
  }

  return script;
}
