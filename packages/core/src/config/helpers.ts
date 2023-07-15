import cloneDeep from 'lodash/cloneDeep';
import { SporeConfig, SporeConfigScripts } from './types';
import { Merge } from 'type-fest';

/**
 * Get a specific Script from CNftConfig,
 * and throws an error if the script doesn't exist.
 */
export function getSporeConfigScript(config: SporeConfig, scriptName: string) {
  const script = config.scripts[scriptName];
  if (!script) {
    throw new Error(`${scriptName} script not defined in CNftConfig`);
  }

  return script;
}

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
  } as SporeConfigScripts<T1 | T2>;

  return {
    ...origin,
    ...change,
    scripts,
    extensions,
  };
}

type Type1 = 'A' | 'B';
type Type2 = 'C';
type Type3 = Type1 | Type2;
