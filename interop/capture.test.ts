import { expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { blockchain } from '@ckb-lumos/base';
import { molecule, bytes } from '@ckb-lumos/codec';
import { RPC } from '@ckb-lumos/lumos';
import { capture } from './capture';
const hash = (n: number) => '0x' + n.toString(16).padStart(2, '0').repeat(32);
it('captures packed SDK transactions and resolves dep-group members for offline VM replay', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'spore-capture-'));
  const previous = process.env.SPORE_V3_VM_CAPTURE;
  process.env.SPORE_V3_VM_CAPTURE = join(dir, 'capture.jsonl');
  const point = (n: number) => ({ txHash: hash(n), index: '0x0' });
  const output = { capacity: '0x174876e800', lock: { codeHash: hash(8), hashType: 'data' as const, args: '0x' } };
  const getLiveCell = vi.fn(async (p: ReturnType<typeof point>) => ({
    status: 'live',
    cell: {
      output,
      data: {
        content: p.txHash === hash(2) ? bytes.hexify(molecule.vector(blockchain.OutPoint).pack([point(3)])) : '0x',
      },
    },
  }));
  const tx = {
    version: '0x0',
    cellDeps: [{ outPoint: point(2), depType: 'depGroup' as const }],
    headerDeps: [],
    inputs: [{ previousOutput: point(1), since: '0x0' }],
    outputs: [output],
    outputsData: ['0x'],
    witnesses: ['0x'],
  };
  try {
    await capture(tx, { getLiveCell } as unknown as RPC, 93, true);
    const saved = JSON.parse(readFileSync(process.env.SPORE_V3_VM_CAPTURE, 'utf8'));
    expect(blockchain.Transaction.unpack(saved.tx)).toEqual(tx);
    expect(saved.cells.length).toBe(3);
    expect(saved.expectedError).toBe(93);
    expect(saved.expectReject).toBe(true);
  } finally {
    if (previous === undefined) delete process.env.SPORE_V3_VM_CAPTURE;
    else process.env.SPORE_V3_VM_CAPTURE = previous;
    rmSync(dir, { recursive: true, force: true });
  }
});
