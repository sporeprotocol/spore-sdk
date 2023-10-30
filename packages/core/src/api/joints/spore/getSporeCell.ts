import { OutPoint, Script } from '@ckb-lumos/base';
import { Cell, HexString, Indexer, RPC } from '@ckb-lumos/lumos';
import { getCellByType, getCellWithStatusByOutPoint } from '../../../helpers';
import { getSporeConfig, getSporeScript, isSporeScriptSupportedByName, SporeConfig } from '../../../config';

export async function getSporeCellByType(type: Script, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get cell by type
  const cell = await getCellByType({ type, indexer });
  if (cell === void 0) {
    throw new Error('Cannot find Spore by Type because target cell does not exist');
  }

  // Check target cell's type script
  const cellType = cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'Spore', cellType)) {
    throw new Error('Cannot find spore by Type because target cell type is not Spore');
  }

  return cell;
}

export async function getSporeCellByOutPoint(outPoint: OutPoint, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({ outPoint, rpc });
  if (cellWithStatus.status !== 'live') {
    throw new Error('Cannot find spore by OutPoint because target cell is not lived');
  }

  // Check target cell's type script
  const cellType = cellWithStatus.cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'Spore', cellType)) {
    throw new Error('Cannot find spore by OutPoint because target cell type is not Spore');
  }

  return cellWithStatus.cell;
}

export async function getSporeCellById(id: HexString, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();

  // Get SporeType script
  const sporeScript = getSporeScript(config, 'Spore');
  const versionScripts = (sporeScript.versions ?? []).map((r) => r.script);
  const scripts = [sporeScript.script, ...versionScripts];

  // Search target spore from the latest version to the oldest
  for (const script of scripts) {
    try {
      return await getSporeCellByType(
        {
          ...script,
          args: id,
        },
        config,
      );
    } catch {
      // Not found in the script, don't have to do anything
    }
  }

  throw new Error(`Cannot find spore by SporeId because target cell does not exist or it's not Spore`);
}
