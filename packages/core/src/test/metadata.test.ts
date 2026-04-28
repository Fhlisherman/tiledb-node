import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Context, TileDBArray, ArraySchema, Dimension, Domain, Attribute } from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

describe('TileDBArray Metadata', () => {
  const uri = path.join(__dirname, '__test_metadata_array');
  const ctx = new Context();

  beforeEach(async () => {
    if (fs.existsSync(uri)) {
      fs.rmSync(uri, { recursive: true, force: true });
    }
    
    const schema = new ArraySchema(ctx, 'DENSE');
    const domain = new Domain(ctx);
    const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 2);
    domain.addDimension(dim);
    schema.setDomain(domain);
    
    const attr = new Attribute(ctx, 'a1', 'INT32');
    schema.addAttribute(attr);
    
    await TileDBArray.create(uri, schema);
  });

  afterEach(() => {
    if (fs.existsSync(uri)) {
      fs.rmSync(uri, { recursive: true, force: true });
    }
  });

  it('should be able to put, get, and delete metadata', () => {
    // Open for writing
    const arrayWrite = new TileDBArray(ctx, uri, 'WRITE');
    
    arrayWrite.putMetadata('key_int', 'INT32', 42);
    arrayWrite.putMetadata('key_str', 'STRING_UTF8', 'hello world');
    arrayWrite.putMetadata('key_float', 'FLOAT64', 3.14);
    
    arrayWrite.close();

    // Open for reading
    const arrayRead = new TileDBArray(ctx, uri, 'READ');
    
    expect(arrayRead.getMetadataNum()).toBe(3);
    
    const valInt = arrayRead.getMetadata('key_int');
    expect(valInt).toBe(42);
    
    const valStr = arrayRead.getMetadata('key_str');
    expect(valStr).toBe('hello world');
    
    const valFloat = arrayRead.getMetadata('key_float');
    expect(valFloat).toBeCloseTo(3.14);

    // Iterating over metadata
    const parsedMeta: Record<string, any> = {};
    for (let i = 0; i < arrayRead.getMetadataNum(); i++) {
        const item = arrayRead.getMetadataByIndex(i);
        parsedMeta[item.key] = item.value;
    }

    expect(parsedMeta).toEqual({
        'key_int': 42,
        'key_str': 'hello world',
        'key_float': 3.14
    });

    arrayRead.close();

    // Open for writing again to delete
    const arrayWriteDelete = new TileDBArray(ctx, uri, 'WRITE');
    arrayWriteDelete.deleteMetadata('key_int');
    arrayWriteDelete.close();

    // Verify deletion
    const arrayReadAfterDelete = new TileDBArray(ctx, uri, 'READ');
    expect(arrayReadAfterDelete.getMetadataNum()).toBe(2);
    expect(arrayReadAfterDelete.getMetadata('key_int')).toBeNull(); // Or undefined based on convert_metadata_to_napi
    arrayReadAfterDelete.close();
  });
});
