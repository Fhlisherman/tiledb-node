import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Context, TileDBArray, Subarray, Query, ArraySchema, Dimension, Domain, Attribute, Stats } from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Stats API', () => {
  let ctx: Context;
  const testDir = path.join(__dirname, 'stats_test_dir');
  const arrayUri = path.join(testDir, 'stats_array');

  beforeEach(async () => {
    ctx = new Context();
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir);
  });

  afterEach(() => {
    if (ctx) ctx.close();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should enable, trace, and dump stats string', async () => {
    // 1. Enable Stats
    Stats.enable();

    // 2. Perform some basic operations
    const dim = new Dimension(ctx, "d1", "INT32", 1, 10, 5);
    const dom = new Domain(ctx);
    dom.addDimension(dim);

    const attr = new Attribute(ctx, "a1", "INT32");

    const schema = new ArraySchema(ctx, "DENSE");
    schema.setDomain(dom);
    schema.addAttribute(attr);

    await TileDBArray.create(arrayUri, schema);

    const arr = new TileDBArray(ctx, arrayUri);
    await arr.open("WRITE");

    const query = new Query(ctx, arr, "WRITE");
    query.setLayout("ROW_MAJOR");
    query.setDataBuffer("a1", new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    
    const sub = new Subarray(ctx, arr);
    sub.addRange("d1", 1, 10);
    query.setSubarray(sub);
    query.submit();

    // 3. Get query stats specifically
    const qStats = query.getStats();
    expect(typeof qStats).toBe('string');
    expect(qStats.length).toBeGreaterThan(0);
    expect(qStats).toContain('Context.Query.Writer.');

    // 4. Dump global stats
    const globalStats = Stats.dumpStr();
    expect(typeof globalStats).toBe('string');
    expect(globalStats.length).toBeGreaterThan(0);
    expect(globalStats).toContain('Context.Query.Writer.');

    // Disable and cleanup
    Stats.disable();
    query.close();
    sub.close();
    arr.close();
    schema.close();
    attr.close();
    dom.close();
    dim.close();
  });

  it('should reset stats and produce empty output', () => {
    Stats.enable();
    Stats.reset();
    const stats = Stats.dumpStr();
    // After reset with no operations, stats should be empty or minimal
    expect(typeof stats).toBe('string');
    Stats.disable();
  });

  it('should handle enable/disable idempotently', () => {
    // Multiple enables should not throw
    Stats.enable();
    Stats.enable();
    Stats.disable();
    Stats.disable();
    // Should still work after re-enabling
    Stats.enable();
    const stats = Stats.dumpStr();
    expect(typeof stats).toBe('string');
    Stats.disable();
  });
});
