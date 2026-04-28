import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import {
  Context, Config, Dimension, Domain, Attribute, ArraySchema,
  TileDBArray, Query, Subarray, QueryCondition,
  TileDBGroup, TileDBObject, VFS, FragmentInfo, Stats, TileDBError
} from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────
// 1. Context + Config
// ─────────────────────────────────────────────────────────────
describe('Context & Config', () => {
  it('should create a Context with a Config', () => {
    const config = new Config();
    config.set('sm.memory_budget', '1000000');
    const ctx = new Context(config);
    const version = ctx.getVersion();
    expect(version.major).toBeGreaterThanOrEqual(2);
    ctx.close();
    config.close();
  });

  it('should unset a config parameter', () => {
    const config = new Config();
    config.set('vfs.s3.region', 'eu-west-1');
    expect(config.get('vfs.s3.region')).toBe('eu-west-1');
    config.unset('vfs.s3.region');
    // After unset, should return default or throw
    // TileDB returns empty string for unset keys that have no default
    const val = config.get('vfs.s3.region');
    expect(typeof val).toBe('string');
    config.close();
  });

  it('should throw when using a closed Context', () => {
    const ctx = new Context();
    ctx.close();
    expect(() => ctx.getVersion()).toThrow();
  });

  it('should throw when using a closed Config', () => {
    const config = new Config();
    config.close();
    expect(() => config.set('key', 'val')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 2. TileDBError
// ─────────────────────────────────────────────────────────────
describe('TileDBError', () => {
  it('should parse component and details from TileDB error messages', () => {
    const err = new TileDBError('[TileDB::Array] Error: Array does not exist');
    expect(err.name).toBe('TileDBError');
    expect(err.component).toBe('Array');
    expect(err.details).toBe('Array does not exist');
    expect(err.message).toBe('[TileDB::Array] Error: Array does not exist');
    expect(err instanceof Error).toBe(true);
  });

  it('should handle messages without TileDB pattern', () => {
    const err = new TileDBError('Generic error message');
    expect(err.name).toBe('TileDBError');
    expect(err.component).toBeUndefined();
    expect(err.details).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Dimension introspection
// ─────────────────────────────────────────────────────────────
describe('Dimension introspection', () => {
  it('should return name, type, domain, and tileExtent', () => {
    const ctx = new Context();
    const dim = new Dimension(ctx, 'my_dim', 'INT32', 1, 100, 10);

    expect(dim.name()).toBe('my_dim');
    expect(dim.type()).toBe('INT32');

    // domain() and tileExtent() return string representations
    const domain = dim.domain();
    expect(typeof domain).toBe('string');
    const extent = dim.tileExtent();
    expect(typeof extent).toBe('string');

    dim.close();
    ctx.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Attribute introspection
// ─────────────────────────────────────────────────────────────
describe('Attribute introspection', () => {
  it('should correctly report nullable state', () => {
    const ctx = new Context();
    const attr = new Attribute(ctx, 'a1', 'INT32');

    expect(attr.nullable()).toBe(false);
    attr.setNullable(true);
    expect(attr.nullable()).toBe(true);

    attr.close();
    ctx.close();
  });

  it('should correctly report cellValNum', () => {
    const ctx = new Context();
    const attr = new Attribute(ctx, 'a1', 'INT32');

    expect(attr.cellValNum()).toBe(1);
    attr.setCellValNum(3);
    expect(attr.cellValNum()).toBe(3);

    attr.close();
    ctx.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 5. ArraySchema introspection
// ─────────────────────────────────────────────────────────────
describe('ArraySchema properties', () => {
  it('should report arrayType and attributeCount', () => {
    const ctx = new Context();
    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 2);
    const dom = new Domain(ctx);
    dom.addDimension(dim);

    const attr1 = new Attribute(ctx, 'a1', 'INT32');
    const attr2 = new Attribute(ctx, 'a2', 'FLOAT64');

    const schema = new ArraySchema(ctx, 'SPARSE');
    schema.setDomain(dom);
    schema.addAttribute(attr1);
    schema.addAttribute(attr2);

    expect(schema.arrayType()).toBe('SPARSE');
    expect(schema.attributeCount()).toBe(2);
    expect(schema.check()).toBe(true);

    schema.close();
    attr1.close();
    attr2.close();
    dom.close();
    dim.close();
    ctx.close();
  });

  it('should set and validate cell/tile order', () => {
    const ctx = new Context();
    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 2);
    const dom = new Domain(ctx);
    dom.addDimension(dim);
    const attr = new Attribute(ctx, 'a1', 'INT32');

    const schema = new ArraySchema(ctx, 'DENSE');
    schema.setDomain(dom);
    schema.addAttribute(attr);

    // Should not throw
    schema.setCellOrder('ROW_MAJOR');
    schema.setTileOrder('COL_MAJOR');
    expect(schema.check()).toBe(true);

    schema.close();
    attr.close();
    dom.close();
    dim.close();
    ctx.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Domain introspection
// ─────────────────────────────────────────────────────────────
describe('Domain introspection', () => {
  it('should report ndim and list dimensions', () => {
    const ctx = new Context();
    const dim1 = new Dimension(ctx, 'x', 'INT32', 1, 10, 2);
    const dim2 = new Dimension(ctx, 'y', 'INT32', 1, 10, 2);
    const dom = new Domain(ctx);
    dom.addDimension(dim1);
    dom.addDimension(dim2);

    expect(dom.ndim()).toBe(2);
    const dims = dom.dimensions();
    expect(dims.length).toBe(2);

    dom.close();
    dim1.close();
    dim2.close();
    ctx.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 7. Async submitAsync full write→read cycle
// ─────────────────────────────────────────────────────────────
describe('Async submitAsync full cycle', () => {
  const ctx = new Context();
  const arrayUri = path.join(__dirname, '__test_async_cycle');

  beforeAll(async () => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }

    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 5);
    const dom = new Domain(ctx);
    dom.addDimension(dim);
    const attr = new Attribute(ctx, 'a1', 'INT32');
    const schema = new ArraySchema(ctx, 'DENSE');
    schema.setDomain(dom);
    schema.addAttribute(attr);
    await TileDBArray.create(arrayUri, schema);
  });

  afterAll(() => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }
  });

  it('should write data synchronously and read asynchronously', async () => {
    // Write
    const arrayWrite = new TileDBArray(ctx, arrayUri);
    await arrayWrite.open('WRITE');
    const queryWrite = new Query(ctx, arrayWrite, 'WRITE');
    queryWrite.setLayout('ROW_MAJOR');
    const sub = new Subarray(ctx, arrayWrite);
    sub.addRange('d1', 1, 5);
    queryWrite.setSubarray(sub);
    queryWrite.setDataBuffer('a1', new Int32Array([10, 20, 30, 40, 50]));
    const writeStatus = queryWrite.submit();
    expect(writeStatus).toBe('COMPLETE');
    queryWrite.close();
    sub.close();
    arrayWrite.close();

    // Read async
    const arrayRead = new TileDBArray(ctx, arrayUri);
    await arrayRead.open('READ');
    const queryRead = new Query(ctx, arrayRead, 'READ');
    queryRead.setLayout('ROW_MAJOR');
    const subRead = new Subarray(ctx, arrayRead);
    subRead.addRange('d1', 1, 5);
    queryRead.setSubarray(subRead);
    const readData = new Int32Array(5);
    queryRead.setDataBuffer('a1', readData);

    const readStatus = await queryRead.submitAsync();
    expect(readStatus).toBe('COMPLETE');
    expect(Array.from(readData)).toEqual([10, 20, 30, 40, 50]);

    queryRead.close();
    subRead.close();
    arrayRead.close();
  });

  it('should verify queryStatus after async submit', async () => {
    const arrayRead = new TileDBArray(ctx, arrayUri);
    await arrayRead.open('READ');
    const queryRead = new Query(ctx, arrayRead, 'READ');
    queryRead.setLayout('ROW_MAJOR');
    const sub = new Subarray(ctx, arrayRead);
    sub.addRange('d1', 1, 5);
    queryRead.setSubarray(sub);
    const readData = new Int32Array(5);
    queryRead.setDataBuffer('a1', readData);

    await queryRead.submitAsync();
    expect(queryRead.queryStatus()).toBe('COMPLETE');

    queryRead.close();
    sub.close();
    arrayRead.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 8. QueryCondition combine & negate
// ─────────────────────────────────────────────────────────────
describe('QueryCondition combine & negate', () => {
  const ctx = new Context();
  const arrayUri = path.join(__dirname, '__test_qc_combine');

  beforeAll(async () => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }

    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 100, 10);
    const dom = new Domain(ctx);
    dom.addDimension(dim);
    const attr = new Attribute(ctx, 'val', 'INT32');
    const schema = new ArraySchema(ctx, 'SPARSE');
    schema.setDomain(dom);
    schema.addAttribute(attr);
    await TileDBArray.create(arrayUri, schema);

    // Write data: coords [1,2,3,4,5], vals [10,20,30,40,50]
    const arrayWrite = new TileDBArray(ctx, arrayUri, 'WRITE');
    const q = new Query(ctx, arrayWrite, 'WRITE');
    q.setLayout('UNORDERED');
    q.setDataBuffer('d1', new Int32Array([1, 2, 3, 4, 5]));
    q.setDataBuffer('val', new Int32Array([10, 20, 30, 40, 50]));
    q.submit();
    q.close();
    arrayWrite.close();
  });

  afterAll(() => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }
  });

  it('should combine two conditions with AND', () => {
    const arr = new TileDBArray(ctx, arrayUri, 'READ');
    const q = new Query(ctx, arr, 'READ');
    q.setLayout('UNORDERED');

    // val > 15 AND val < 45
    const qc1 = QueryCondition.create(ctx, 'val', new Int32Array([15]), 'GT');
    const qc2 = QueryCondition.create(ctx, 'val', new Int32Array([45]), 'LT');
    const combined = qc1.combine(qc2, 'AND');
    q.setCondition(combined);

    const readCoords = new Int32Array(5);
    const readVals = new Int32Array(5);
    q.setDataBuffer('d1', readCoords);
    q.setDataBuffer('val', readVals);
    q.submit();

    const elems = q.resultBufferElements();
    const count = elems['d1'].second;
    // Should return vals 20, 30, 40
    expect(count).toBe(3);

    const resultVals = Array.from(readVals).slice(0, count).sort((a, b) => a - b);
    expect(resultVals).toEqual([20, 30, 40]);

    q.close();
    arr.close();
  });

  it('should combine two conditions with OR', () => {
    const arr = new TileDBArray(ctx, arrayUri, 'READ');
    const q = new Query(ctx, arr, 'READ');
    q.setLayout('UNORDERED');

    // val == 10 OR val == 50
    const qc1 = QueryCondition.create(ctx, 'val', new Int32Array([10]), 'EQ');
    const qc2 = QueryCondition.create(ctx, 'val', new Int32Array([50]), 'EQ');
    const combined = qc1.combine(qc2, 'OR');
    q.setCondition(combined);

    const readCoords = new Int32Array(5);
    const readVals = new Int32Array(5);
    q.setDataBuffer('d1', readCoords);
    q.setDataBuffer('val', readVals);
    q.submit();

    const elems = q.resultBufferElements();
    const count = elems['d1'].second;
    expect(count).toBe(2);

    const resultVals = Array.from(readVals).slice(0, count).sort((a, b) => a - b);
    expect(resultVals).toEqual([10, 50]);

    q.close();
    arr.close();
  });

  it('should negate a condition', () => {
    const arr = new TileDBArray(ctx, arrayUri, 'READ');
    const q = new Query(ctx, arr, 'READ');
    q.setLayout('UNORDERED');

    // NOT (val > 30) → should return vals 10, 20, 30
    const qc = QueryCondition.create(ctx, 'val', new Int32Array([30]), 'GT');
    const negated = qc.negate();
    q.setCondition(negated);

    const readCoords = new Int32Array(5);
    const readVals = new Int32Array(5);
    q.setDataBuffer('d1', readCoords);
    q.setDataBuffer('val', readVals);
    q.submit();

    const elems = q.resultBufferElements();
    const count = elems['d1'].second;
    expect(count).toBe(3);

    const resultVals = Array.from(readVals).slice(0, count).sort((a, b) => a - b);
    expect(resultVals).toEqual([10, 20, 30]);

    q.close();
    arr.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 9. Consolidate & Vacuum
// ─────────────────────────────────────────────────────────────
describe('Array Consolidate & Vacuum', () => {
  const ctx = new Context();
  const arrayUri = path.join(__dirname, '__test_consolidate_vacuum');

  beforeAll(async () => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }
    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 5);
    const dom = new Domain(ctx);
    dom.addDimension(dim);
    const attr = new Attribute(ctx, 'a1', 'INT32');
    const schema = new ArraySchema(ctx, 'DENSE');
    schema.setDomain(dom);
    schema.addAttribute(attr);
    await TileDBArray.create(arrayUri, schema);

    // Write fragment 1
    let arr = new TileDBArray(ctx, arrayUri);
    await arr.open('WRITE');
    let sub = new Subarray(ctx, arr);
    sub.addRange('d1', 1, 5);
    let q = new Query(ctx, arr, 'WRITE');
    q.setLayout('ROW_MAJOR');
    q.setSubarray(sub);
    q.setDataBuffer('a1', new Int32Array([1, 2, 3, 4, 5]));
    q.submit();
    q.close(); sub.close(); arr.close();

    // Write fragment 2
    arr = new TileDBArray(ctx, arrayUri);
    await arr.open('WRITE');
    sub = new Subarray(ctx, arr);
    sub.addRange('d1', 6, 10);
    q = new Query(ctx, arr, 'WRITE');
    q.setLayout('ROW_MAJOR');
    q.setSubarray(sub);
    q.setDataBuffer('a1', new Int32Array([6, 7, 8, 9, 10]));
    q.submit();
    q.close(); sub.close(); arr.close();
  });

  afterAll(() => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }
  });

  it('should consolidate an array', async () => {
    await TileDBArray.consolidate(ctx, arrayUri);
    // After consolidation, data should still be readable
    const arr = new TileDBArray(ctx, arrayUri, 'READ');
    const q = new Query(ctx, arr, 'READ');
    q.setLayout('ROW_MAJOR');
    const sub = new Subarray(ctx, arr);
    sub.addRange('d1', 1, 10);
    q.setSubarray(sub);
    const readData = new Int32Array(10);
    q.setDataBuffer('a1', readData);
    q.submit();
    expect(Array.from(readData)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    q.close(); sub.close(); arr.close();
  });

  it('should vacuum an array', async () => {
    await TileDBArray.vacuum(ctx, arrayUri);
    // After vacuum, fragments should have been cleaned up; data should still be readable
    const arr = new TileDBArray(ctx, arrayUri, 'READ');
    const q = new Query(ctx, arr, 'READ');
    q.setLayout('ROW_MAJOR');
    const sub = new Subarray(ctx, arr);
    sub.addRange('d1', 1, 10);
    q.setSubarray(sub);
    const readData = new Int32Array(10);
    q.setDataBuffer('a1', readData);
    q.submit();
    expect(Array.from(readData)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    q.close(); sub.close(); arr.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 10. Group Consolidate & Vacuum
// ─────────────────────────────────────────────────────────────
describe('Group Consolidate & Vacuum', () => {
  const ctx = new Context();
  const groupUri = path.join(__dirname, '__test_group_consolidate');

  beforeAll(() => {
    if (fs.existsSync(groupUri)) {
      fs.rmSync(groupUri, { recursive: true, force: true });
    }
    TileDBGroup.create(ctx, groupUri);

    // Write some metadata to create fragments
    const g = new TileDBGroup(ctx, groupUri, 'WRITE');
    g.putMetadata('key1', 'INT32', 42);
    g.close();
  });

  afterAll(() => {
    if (fs.existsSync(groupUri)) {
      fs.rmSync(groupUri, { recursive: true, force: true });
    }
  });

  it('should consolidate group metadata', () => {
    // Should not throw
    TileDBGroup.consolidate(ctx, groupUri);
    // Verify metadata is still accessible
    const g = new TileDBGroup(ctx, groupUri, 'READ');
    expect(g.getMetadataNum()).toBe(1);
    expect(g.getMetadata('key1')).toBe(42);
    g.close();
  });

  it('should vacuum group metadata', () => {
    // Should not throw
    TileDBGroup.vacuum(ctx, groupUri);
    // Verify metadata is still accessible
    const g = new TileDBGroup(ctx, groupUri, 'READ');
    expect(g.getMetadataNum()).toBe(1);
    g.close();
  });
});

// ─────────────────────────────────────────────────────────────
// 11. VFS directory operations
// ─────────────────────────────────────────────────────────────
describe('VFS directory operations', () => {
  const ctx = new Context();
  const vfs = new VFS(ctx);
  const baseDir = path.join(__dirname, '__test_vfs_dir_ops');
  const srcDir = path.join(baseDir, 'src_dir');
  const dstDir = path.join(baseDir, 'dst_dir');
  const movedDir = path.join(baseDir, 'moved_dir');

  beforeEach(() => {
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
    vfs.createDir(baseDir);
  });

  afterEach(() => {
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
  });

  it('should copy and move directories', () => {
    vfs.createDir(srcDir);
    vfs.touch(path.join(srcDir, 'file_in_dir'));

    // copyDir
    vfs.copyDir(srcDir, dstDir);
    expect(vfs.isDir(dstDir)).toBe(true);

    // moveDir
    vfs.moveDir(dstDir, movedDir);
    expect(vfs.isDir(dstDir)).toBe(false);
    expect(vfs.isDir(movedDir)).toBe(true);
  });

  it('should re-open a file after closeFile()', () => {
    const filePath = path.join(baseDir, 'reopen_test.txt');
    vfs.touch(filePath);

    // First write
    vfs.open(filePath, 'write');
    vfs.write(Buffer.from('first'));
    vfs.closeFile();

    // Re-open and read
    vfs.open(filePath, 'read');
    const data = vfs.read(0, 5);
    vfs.closeFile();
    expect(data.toString()).toBe('first');
  });
});

// ─────────────────────────────────────────────────────────────
// 12. Query.getStats() returns non-trivial content
// ─────────────────────────────────────────────────────────────
describe('Query.getStats()', () => {
  const ctx = new Context();
  const arrayUri = path.join(__dirname, '__test_query_stats');

  beforeAll(async () => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }
    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 5);
    const dom = new Domain(ctx);
    dom.addDimension(dim);
    const attr = new Attribute(ctx, 'a1', 'INT32');
    const schema = new ArraySchema(ctx, 'DENSE');
    schema.setDomain(dom);
    schema.addAttribute(attr);
    await TileDBArray.create(arrayUri, schema);

    const arr = new TileDBArray(ctx, arrayUri);
    await arr.open('WRITE');
    const q = new Query(ctx, arr, 'WRITE');
    q.setLayout('ROW_MAJOR');
    const sub = new Subarray(ctx, arr);
    sub.addRange('d1', 1, 5);
    q.setSubarray(sub);
    q.setDataBuffer('a1', new Int32Array([1, 2, 3, 4, 5]));
    q.submit();
    q.close(); sub.close(); arr.close();
  });

  afterAll(() => {
    if (fs.existsSync(arrayUri)) {
      fs.rmSync(arrayUri, { recursive: true, force: true });
    }
  });

  it('should return per-query stats as a non-empty string', () => {
    const arr = new TileDBArray(ctx, arrayUri, 'READ');
    const q = new Query(ctx, arr, 'READ');
    q.setLayout('ROW_MAJOR');
    const sub = new Subarray(ctx, arr);
    sub.addRange('d1', 1, 5);
    q.setSubarray(sub);
    const readData = new Int32Array(5);
    q.setDataBuffer('a1', readData);
    q.submit();

    const stats = q.getStats();
    expect(typeof stats).toBe('string');
    expect(stats.length).toBeGreaterThan(0);

    q.close(); sub.close(); arr.close();
  });
});
