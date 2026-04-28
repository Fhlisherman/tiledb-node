import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Context, TileDBArray, Subarray, Query, ArraySchema, Dimension, Domain, Attribute, FragmentInfo } from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

describe('FragmentInfo API', () => {
  let ctx: Context;
  const testDir = path.join(__dirname, 'fragment_test_dir');
  const arrayUri = path.join(testDir, 'fragment_array');

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

  it('should load fragment info and report correctly for multiple writes', async () => {
    // 1. Create Array
    const dim = new Dimension(ctx, "d1", "INT32", 1, 20, 5);
    const dom = new Domain(ctx);
    dom.addDimension(dim);
    const attr = new Attribute(ctx, "a1", "INT32");
    const schema = new ArraySchema(ctx, "DENSE");
    schema.setDomain(dom);
    schema.addAttribute(attr);

    await TileDBArray.create(arrayUri, schema);

    // Write Fragment 1
    let arr = new TileDBArray(ctx, arrayUri);
    await arr.open("WRITE");
    let sub = new Subarray(ctx, arr);
    sub.addRange("d1", 1, 5);
    let query = new Query(ctx, arr, "WRITE");
    query.setLayout("ROW_MAJOR");
    query.setSubarray(sub);
    query.setDataBuffer("a1", new Int32Array([1, 2, 3, 4, 5]));
    query.submit();
    query.close(); sub.close(); arr.close();

    // Write Fragment 2
    arr = new TileDBArray(ctx, arrayUri);
    await arr.open("WRITE");
    sub = new Subarray(ctx, arr);
    sub.addRange("d1", 6, 10);
    query = new Query(ctx, arr, "WRITE");
    query.setLayout("ROW_MAJOR");
    query.setSubarray(sub);
    query.setDataBuffer("a1", new Int32Array([6, 7, 8, 9, 10]));
    query.submit();
    query.close(); sub.close(); arr.close();

    schema.close();
    attr.close();
    dom.close();
    dim.close();

    // 2. Load Fragment Info
    const fi = new FragmentInfo(ctx, arrayUri);
    fi.load();

    const numFragments = fi.fragmentNum();
    expect(numFragments).toBe(2);

    // Validate fragment 0
    const uri0 = fi.fragmentUri(0);
    expect(uri0).toContain(arrayUri);
    const size0 = fi.fragmentSize(0);
    expect(size0).toBeGreaterThan(0);
    const range0 = fi.timestampRange(0);
    expect(range0[0]).toBeGreaterThan(0);
    
    // Validate fragment 1
    const uri1 = fi.fragmentUri(1);
    expect(uri1).toContain(arrayUri);
    expect(uri0).not.toBe(uri1);
    const mbrs1 = fi.mbrNum(1);
    expect(mbrs1).toBeGreaterThanOrEqual(0); // MBRs are only meaningful for SPARSE arrays
  });
});
