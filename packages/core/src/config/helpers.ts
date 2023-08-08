import cloneDeep from 'lodash/cloneDeep';
import { predefinedSporeConfigs } from './predefined';
import { ScriptId } from '../types';
import { isScriptIdEquals } from '../helpers';
import { SporeConfig, SporeScript, SporeScripts, SporeVersionedScript } from './types';

const env: {
  config: SporeConfig;
} = {
  config: predefinedSporeConfigs.Aggron4,
};

/**
 * Set the global default SporeConfig.
 * The default config is "predefinedSporeConfigs.Aggron4".
 */
export function setSporeConfig(config: SporeConfig) {
  env.config = config;
}

/**
 * Get the global default SporeConfig.
 * The default config is "predefinedSporeConfigs.Aggron4".
 */
export function getSporeConfig() {
  return env.config;
}

/**
 * Get a specific SporeScript from SporeConfig,
 * and throws an error if the script doesn't exist.
 */
export function getSporeScript(config: SporeConfig, scriptName: string): SporeVersionedScript;
export function getSporeScript(config: SporeConfig, scriptName: string, scriptId?: ScriptId): SporeScript;
export function getSporeScript(config: SporeConfig, scriptName: string, scriptId?: ScriptId) {
  const script = config.scripts[scriptName];
  if (!script) {
    throw new Error(`${scriptName} script is not defined in the SporeConfig`);
  }

  if (!scriptId || isDirectSporeScript(script, scriptId)) {
    return script;
  }

  const versioned = getSporeScriptVersion(script, scriptId);
  if (!versioned) {
    throw new Error(`${scriptName} script with a version is not defined in the SporeConfig`);
  }
  return versioned;
}

/**
 * Find any version of a SporeScript by the specified ScriptId.
 */
export function getSporeScriptVersion(sporeScript: SporeVersionedScript, scriptId: ScriptId): SporeScript | undefined {
  const versions = sporeScript.versions ?? [];
  if (versions.length) {
    for (const version of versions) {
      if (isScriptIdEquals(version.script, scriptId)) {
        return version;
      }
    }
  }

  return void 0;
}

/**
 * Check if the target ScriptId is any version of the specified SporeScript.
 * The difference between this function and the `isSporeScriptSupported` is,
 * this function accepts SporeConfig and the name of SporeScript as parameters.
 */
export function isSporeScriptSupportedByName(config: SporeConfig, scriptName: string, scriptId: ScriptId) {
  const script = getSporeScript(config, scriptName);
  return isSporeScriptSupported(script, scriptId);
}

/**
 * Check if the target ScriptId is any version of the specified SporeScript.
 */
export function isSporeScriptSupported(sporeScript: SporeVersionedScript, scriptId: ScriptId) {
  if (isDirectSporeScript(sporeScript, scriptId)) return true;
  return isVersionedSporeScript(sporeScript, scriptId);
}

/**
 * Check if the target ScriptId is the latest version of the specified SporeScript.
 */
export function isDirectSporeScript(sporeScript: SporeScript, scriptId: ScriptId) {
  return isScriptIdEquals(sporeScript.script, scriptId);
}

/**
 * Check if the target ScriptId is an historical version of the specified SporeScript.
 */
export function isVersionedSporeScript(sporeScript: SporeVersionedScript, scriptId: ScriptId) {
  return getSporeScriptVersion(sporeScript, scriptId) !== void 0;
}

/**
 * Clone and create a new SporeConfig.
 */
export function forkSporeConfig<T1 extends string, T2 extends string>(
  origin: SporeConfig<T1>,
  change: Partial<SporeConfig<T2>>,
): SporeConfig<T1 | T2> {
  origin = cloneDeep(origin);

  const extensions = origin.extensions;
  if (change.extensions) {
    for (const extension of change.extensions) {
      const originExtensionIndex = extensions.findIndex((row) => {
        return row.name === extension.name && row.dataHash === extension.dataHash;
      });
      if (originExtensionIndex !== -1) {
        extensions.splice(originExtensionIndex, 1);
      }
      extensions.push(extension);
    }
  }

  const scripts = {
    ...origin.scripts,
    ...change.scripts,
  } as SporeScripts<T1 | T2>;

  return {
    ...origin,
    ...change,
    scripts,
    extensions,
  };
}
