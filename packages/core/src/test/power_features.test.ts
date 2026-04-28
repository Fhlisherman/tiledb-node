import { Context, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Subarray, Query, Enumeration, ArraySchemaEvolution, ConsolidationPlan, VFS } from '../ts/index';
import { tmpdir } from 'os';
import { join } from 'path';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

const testArrayUri = join(tmpdir(), 'tiledb_test_power_features_array');

describe('TileDB Experimental Power Features', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
    const vfs = new VFS(ctx);
    if (vfs.isDir(testArrayUri)) {
        vfs.removeDir(testArrayUri);
    }
    vfs.close();
  });

  afterEach(() => {
    const vfs = new VFS(ctx);
    if (vfs.isDir(testArrayUri)) {
        vfs.removeDir(testArrayUri);
    }
    vfs.close();
    ctx.close();
  });

  describe('Enumerations', () => {
    it('should create an enumeration with string values', () => {
      const strings = ['red', 'green', 'blue'];
      const enmr = Enumeration.create(ctx, 'colors', 'STRING_UTF8', strings);
      expect(enmr.name()).toBe('colors');
    });

    it('should create an enumeration with int values', () => {
      const ints = [10, 20, 30];
      const enmr = Enumeration.create(ctx, 'sizes', 'INT32', ints);
      expect(enmr.name()).toBe('sizes');
    });

    it('should bind an enumeration to a schema and attribute', async () => {
      const dim1 = new Dimension(ctx, 'd1', 'INT32', 1, 10, 2);
      const dom = new Domain(ctx);
      dom.addDimension(dim1);

      const schema = new ArraySchema(ctx, 'DENSE');
      schema.setDomain(dom);

      const strings = ['red', 'green', 'blue'];
      const enmr = Enumeration.create(ctx, 'colors', 'STRING_UTF8', strings);
      schema.addEnumeration(ctx, enmr);

      const attr1 = new Attribute(ctx, 'a1', 'INT32');
      attr1.setEnumerationName(ctx, 'colors');
      schema.addAttribute(attr1);

      expect(schema.check()).toBe(true);

      await TileDBArray.create(testArrayUri, schema);
      schema.close();
      attr1.close();
      dom.close();
      dim1.close();
    });
  });

  describe('Array Schema Evolution', () => {
    it('should add and drop attributes via evolution', async () => {
      // Create initial array with one attribute
      const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 2);
      const dom = new Domain(ctx);
      dom.addDimension(dim);
      const attr = new Attribute(ctx, 'a1', 'INT32');
      const schema = new ArraySchema(ctx, 'DENSE');
      schema.setDomain(dom);
      schema.addAttribute(attr);
      await TileDBArray.create(testArrayUri, schema);
      schema.close();
      attr.close();
      dom.close();
      dim.close();

      // Evolve: add new attribute
      const evo = new ArraySchemaEvolution(ctx);
      const newAttr = new Attribute(ctx, 'a2', 'FLOAT64');
      evo.addAttribute(newAttr);
      evo.arrayEvolve(testArrayUri);
      newAttr.close();

      // Verify new attribute exists
      let arr = new TileDBArray(ctx, testArrayUri, 'READ');
      let arrSchema = arr.schema();
      expect(arrSchema.attributeCount).toBe(2);
      arr.close();

      // Evolve: drop original attribute
      const evo2 = new ArraySchemaEvolution(ctx);
      evo2.dropAttribute('a1');
      evo2.arrayEvolve(testArrayUri);

      arr = new TileDBArray(ctx, testArrayUri, 'READ');
      arrSchema = arr.schema();
      expect(arrSchema.attributeCount).toBe(1);
      arr.close();
    });
  });

  describe('Consolidation Plan', () => {
    it('should create a consolidation plan for an array with fragments', async () => {
      const dim = new Dimension(ctx, 'd_idx', 'INT32', 1, 100, 10);
      const dom = new Domain(ctx);
      dom.addDimension(dim);
      const attr = new Attribute(ctx, 'val', 'INT32');
      const schema = new ArraySchema(ctx, 'DENSE');
      schema.setDomain(dom);
      schema.addAttribute(attr);
      await TileDBArray.create(testArrayUri, schema);
      schema.close();
      attr.close();
      dim.close();
      dom.close();

      // Write multiple fragments
      for (let i = 0; i < 3; i++) {
          const array = new TileDBArray(ctx, testArrayUri, 'WRITE');
          const query = new Query(ctx, array, 'WRITE');
          const subarray = new Subarray(ctx, array);
          const span = 10;
          subarray.addRange('d_idx', i * span + 1, (i + 1) * span);
          query.setSubarray(subarray);
          query.setLayout('ROW_MAJOR');
          query.setDataBuffer('val', new Int32Array(10).fill(i));
          query.submit();
          query.close();
          subarray.close();
          array.close();
      }

      // Verify Consolidation Plan
      const array = new TileDBArray(ctx, testArrayUri, 'READ');
      const plan = new ConsolidationPlan(ctx, array, 1024 * 1024);

      const dumpStr = plan.dump();
      expect(typeof dumpStr).toBe('string');
      expect(dumpStr.length).toBeGreaterThan(0);

      array.close();
    });
  });

  describe('Query Aggregates', () => {
    it('should compute COUNT aggregate on a query', async () => {
      // Array Setup
      const dim = new Dimension(ctx, 'd1', 'INT32', 1, 5, 5);
      const dom = new Domain(ctx);
      dom.addDimension(dim);
      const attr = new Attribute(ctx, 'a', 'INT32');
      const schema = new ArraySchema(ctx, 'DENSE');
      schema.setDomain(dom);
      schema.addAttribute(attr);
      await TileDBArray.create(testArrayUri, schema);
      schema.close();
      attr.close();
      dim.close();
      dom.close();

      // Write Data
      let array = new TileDBArray(ctx, testArrayUri, 'WRITE');
      let query = new Query(ctx, array, 'WRITE');
      query.setLayout('ROW_MAJOR');
      const aData = new Int32Array([10, 20, 30, 40, 50]);
      query.setDataBuffer('a', aData);
      query.submit();
      query.close();
      array.close();

      // Read with COUNT aggregate
      array = new TileDBArray(ctx, testArrayUri, 'READ');
      query = new Query(ctx, array, 'READ');
      query.setLayout('ROW_MAJOR');

      const subarray = new Subarray(ctx, array);
      subarray.addRange('d1', 1, 5);
      query.setSubarray(subarray);

      // COUNT returns uint64 → use BigUint64Array
      query.applyAggregate('count_result', 'COUNT');
      const countBuffer = new BigUint64Array(1);
      query.setDataBuffer('count_result', countBuffer);

      // Also read the attribute data
      const readData = new Int32Array(5);
      query.setDataBuffer('a', readData);

      query.submit();

      expect(Number(countBuffer[0])).toBe(5);

      query.close();
      array.close();
    });

    it('should compute SUM aggregate on a query', async () => {
      // Array Setup
      const dim = new Dimension(ctx, 'd1', 'INT32', 1, 5, 5);
      const dom = new Domain(ctx);
      dom.addDimension(dim);
      const attr = new Attribute(ctx, 'a', 'INT32');
      const schema = new ArraySchema(ctx, 'DENSE');
      schema.setDomain(dom);
      schema.addAttribute(attr);
      await TileDBArray.create(testArrayUri, schema);
      schema.close();
      attr.close();
      dim.close();
      dom.close();

      // Write 
      let array = new TileDBArray(ctx, testArrayUri, 'WRITE');
      let query = new Query(ctx, array, 'WRITE');
      query.setLayout('ROW_MAJOR');
      query.setDataBuffer('a', new Int32Array([1, 2, 3, 4, 5]));
      query.submit();
      query.close();
      array.close();

      // Read with SUM aggregate
      array = new TileDBArray(ctx, testArrayUri, 'READ');
      query = new Query(ctx, array, 'READ');
      query.setLayout('ROW_MAJOR');

      const subarray = new Subarray(ctx, array);
      subarray.addRange('d1', 1, 5);
      query.setSubarray(subarray);

      // SUM of INT32 returns int64
      query.applyAggregate('sum_result', 'SUM', 'a');
      const sumBuffer = new BigInt64Array(1);
      query.setDataBuffer('sum_result', sumBuffer);

      // Read attr too
      const readData = new Int32Array(5);
      query.setDataBuffer('a', readData);

      query.submit();

      expect(Number(sumBuffer[0])).toBe(15);

      query.close();
      array.close();
    });
  });

  describe('Dimension Labels', () => {
    it('should add a dimension label to a schema', async () => {
      const dim = new Dimension(ctx, 'x', 'INT32', 1, 10, 2);
      const dom = new Domain(ctx);
      dom.addDimension(dim);

      const schema = new ArraySchema(ctx, 'DENSE');
      schema.setDomain(dom);

      const attr = new Attribute(ctx, 'val', 'FLOAT64');
      schema.addAttribute(attr);

      // Add dimension label
      schema.addDimensionLabel(ctx, 0, 'timestamp', 'INCREASING', 'FLOAT64');

      expect(schema.check()).toBe(true);

      await TileDBArray.create(testArrayUri, schema);

      schema.close();
      attr.close();
      dim.close();
      dom.close();
    });
  });
});
