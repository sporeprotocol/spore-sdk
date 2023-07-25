import { Address, Script, values } from '@ckb-lumos/base';
import { Config } from '@ckb-lumos/config-manager';
import { helpers } from '@ckb-lumos/lumos';
import { ScriptId } from '../types';

/**
 * Compare two scripts to see if they are identical.
 */
export function isScriptValueEquals(a: Script, b: Script) {
  return new values.ScriptValue(a).equals(new values.ScriptValue(b));
}

/**
 * Compare two scripts to see if their 'codeHash' and 'hashType' are the same.
 */
export function isScriptIdEquals(a: ScriptId, b: ScriptId) {
  return a.codeHash === b.codeHash && a.hashType === b.hashType;
}

/**
 * Check if the target address is valid.
 */
export function isAddressValid(address: Address, config: Config) {
  try {
    helpers.parseAddress(address, {
      config,
    });
    return true;
  } catch {
    return false;
  }
}
