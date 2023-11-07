import { OutPoint, Script } from '@ckb-lumos/base';
import { Cell, HexString, Indexer, RPC } from '@ckb-lumos/lumos';
import { getCellByType, getCellWithStatusByOutPoint } from '../../../helpers';
import { getSporeConfig, getSporeScript, isSporeScriptSupportedByName, SporeConfig } from '../../../config';

export async function getClusterByType(type: Script, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get cell by type
  const cell = await getCellByType({ type, indexer });
  if (cell === void 0) {
    throw new Error('Cannot find cluster by Type because target cell does not exist');
  }

  // Check target cell's type script
  const cellType = cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'Cluster', cellType)) {
    throw new Error('Cannot find cluster by Type because target cell is not Cluster');
  }

  return cell;
}

export async function getClusterByOutPoint(outPoint: OutPoint, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({
    outPoint,
    rpc,
  });
  if (cellWithStatus.status !== 'live') {
    throw new Error('Cannot find cluster by OutPoint because target cell is not lived');
  }

  // Check target cell's type script
  const cellType = cellWithStatus.cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'Cluster', cellType)) {
    throw new Error('Cannot find cluster by OutPoint because target cell is not Cluster');
  }

  return cellWithStatus.cell;
}

export async function getClusterById(id: HexString, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();

  // Get cluster versioned script
  const clusterScript = getSporeScript(config, 'Cluster');
  const versionScripts = (clusterScript.versions ?? []).map((r) => r.script);
  const scripts = [clusterScript.script, ...versionScripts];

  // Search target cluster from the latest version to the oldest
  for (const script of scripts) {
    try {
      return await getClusterByType(
        {
          ...script,
          args: id,
        },
        config,
      );
    } catch (e) {
      // Not found in the script, don't have to do anything
      console.error('getClusterById error:', e);
    }
  }

  throw new Error(`Cannot find cluster by ClusterId because target cell does not exist or it's not Cluster`);
}
