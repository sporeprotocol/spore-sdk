/** Capture resolved SDK transactions for CKB-VM replay without an RPC service. */
import { appendFileSync } from 'node:fs';
import { blockchain, OutPoint, Transaction } from '@ckb-lumos/base';
import { RPC } from '@ckb-lumos/lumos';
import { molecule, bytes } from '@ckb-lumos/codec';
export async function capture(tx: Transaction, rpc: RPC, expectedError?: number, expectReject = false) {
  const path = process.env.SPORE_V3_VM_CAPTURE;
  if (!path) return;
  const cells = new Map<string, { outPoint: string; output: string; data: string }>();
  const resolve = async (point: OutPoint) => {
    const key = bytes.hexify(blockchain.OutPoint.pack(point));
    if (cells.has(key)) return cells.get(key)!;
    const live = await rpc.getLiveCell(point, true);
    if (live.status !== 'live' || !live.cell) throw new Error('Capture requires live resolved cells before submission');
    const cell = {
      outPoint: key,
      output: bytes.hexify(blockchain.CellOutput.pack(live.cell.output)),
      data: live.cell.data.content,
    };
    cells.set(key, cell);
    return cell;
  };
  for (const input of tx.inputs) await resolve(input.previousOutput);
  for (const dep of tx.cellDeps) {
    const cell = await resolve(dep.outPoint);
    if (dep.depType === 'depGroup') {
      for (const member of molecule.vector(blockchain.OutPoint).unpack(cell.data)) await resolve(member);
    }
  }
  appendFileSync(
    path,
    JSON.stringify({
      tx: bytes.hexify(blockchain.Transaction.pack(tx)),
      cells: [...cells.values()],
      expectReject,
      expectedError,
    }) + '\n',
    { mode: 0o600 },
  );
}
