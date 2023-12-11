import { OutPoint } from '@ckb-lumos/base';
import { Cell, RPC } from '@ckb-lumos/lumos';
import { getCellWithStatusByOutPoint } from '../../../helpers';
import { SporeConfig, getSporeConfig, isSporeScriptSupportedByName } from '../../../config';

export async function getClusterAgentByOutPoint(outPoint: OutPoint, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({
    outPoint,
    rpc,
  });
  if (cellWithStatus.status !== 'live') {
    throw new Error('Cannot find ClusterAgent by OutPoint because target cell is not lived');
  }

  // Check target cell's type script
  const cellType = cellWithStatus.cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'ClusterAgent', cellType)) {
    throw new Error('Cannot find ClusterAgent by OutPoint because target cell is not ClusterAgent');
  }

  return cellWithStatus.cell;
}
