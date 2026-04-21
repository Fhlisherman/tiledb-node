import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Context, TileDBArray, ArraySchema, Dimension, Domain, Attribute, TileDBObject } from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

describe('TileDBObject API', () => {
  const baseUri = path.join(__dirname, '__test_object_api');
  const arrUri1 = path.join(baseUri, 'arr1');
  const arrUri2 = path.join(baseUri, 'arr2');
  const newUri = path.join(baseUri, 'arr1_moved');
  const ctx = new Context();

  beforeEach(() => {
    if (fs.existsSync(baseUri)) {
      fs.rmSync(baseUri, { recursive: true, force: true });
    }
    fs.mkdirSync(baseUri, { recursive: true });
    
    // Create first array
    const schema1 = new ArraySchema(ctx, 'DENSE');
    const domain1 = new Domain(ctx);
    domain1.addDimension(new Dimension(ctx, 'd1', 'INT32', 1, 10, 2));
    schema1.setDomain(domain1);
    schema1.addAttribute(new Attribute(ctx, 'a1', 'INT32'));
    TileDBArray.create(arrUri1, schema1);

    // Create second array
    const schema2 = new ArraySchema(ctx, 'DENSE');
    const domain2 = new Domain(ctx);
    domain2.addDimension(new Dimension(ctx, 'd1', 'INT32', 1, 10, 2));
    schema2.setDomain(domain2);
    schema2.addAttribute(new Attribute(ctx, 'a1', 'INT32'));
    TileDBArray.create(arrUri2, schema2);
  });

  afterEach(() => {
    if (fs.existsSync(baseUri)) {
      fs.rmSync(baseUri, { recursive: true, force: true });
    }
  });

  it('should get object type', () => {
    expect(TileDBObject.type(ctx, arrUri1)).toBe('ARRAY');
    expect(TileDBObject.type(ctx, __dirname)).toBe('INVALID'); // Not a TileDB object
  });

  it('should list objects continuously via returning array or callback', () => {
    let cbCalled = 0;
    const contents = TileDBObject.ls(ctx, baseUri, (type, uri) => {
        cbCalled++;
        expect(['ARRAY', 'GROUP']).toContain(type);
    });

    expect(contents.length).toBe(2);
    expect(cbCalled).toBe(2);

    const uris = contents.map(c => Object.values(c)[1] || c.uri); // handle key
    const types = contents.map(c => c.type);
    
    expect(types).toContain('ARRAY');
    // Uris on POSIX / Mac are absolute or based on the baseUri. The path ends with arr1 or arr2.
    expect(uris.some(u => u.endsWith('arr1'))).toBe(true);
    expect(uris.some(u => u.endsWith('arr2'))).toBe(true);
  });

  it('should walk objects with preorder traversal', () => {
    const contents = TileDBObject.walk(ctx, baseUri, 'PREORDER');
    // Walk over baseUri returns baseUri elements
    expect(contents.length).toBeGreaterThan(0); 
  });

  it('should move an object', () => {
    TileDBObject.move(ctx, arrUri1, newUri);
    expect(TileDBObject.type(ctx, arrUri1)).toBe('INVALID');
    expect(TileDBObject.type(ctx, newUri)).toBe('ARRAY');
  });

  it('should remove an object', () => {
    TileDBObject.remove(ctx, arrUri2);
    expect(TileDBObject.type(ctx, arrUri2)).toBe('INVALID');
  });
});
