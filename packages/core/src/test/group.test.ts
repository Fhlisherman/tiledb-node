import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Context, TileDBArray, ArraySchema, Dimension, Domain, Attribute, TileDBGroup } from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

describe('TileDBGroup API', () => {
  const baseUri = path.join(__dirname, '__test_group_api');
  const groupUri = path.join(baseUri, 'my_group');
  const childGroupUri = path.join(baseUri, 'my_group', 'child_group');
  const arrUri = path.join(baseUri, 'my_group', 'child_array');
  const ctx = new Context();

  beforeEach(async () => {
    if (fs.existsSync(baseUri)) {
      fs.rmSync(baseUri, { recursive: true, force: true });
    }
    fs.mkdirSync(baseUri, { recursive: true });
    
    // Create hierarchy
    TileDBGroup.create(ctx, groupUri);
    TileDBGroup.create(ctx, childGroupUri);

    const schema = new ArraySchema(ctx, 'DENSE');
    const domain = new Domain(ctx);
    domain.addDimension(new Dimension(ctx, 'd1', 'INT32', 1, 10, 2));
    schema.setDomain(domain);
    schema.addAttribute(new Attribute(ctx, 'a1', 'INT32'));
    await TileDBArray.create(arrUri, schema);
  });

  afterEach(() => {
    if (fs.existsSync(baseUri)) {
      fs.rmSync(baseUri, { recursive: true, force: true });
    }
  });

  it('should create and open a group safely', () => {
    const group = new TileDBGroup(ctx, groupUri, 'READ');
    expect(group.isOpen()).toBe(true);
    expect(group.queryType()).toBe('READ');
    expect(group.uri().endsWith('my_group')).toBe(true);
    group.close();
    expect(group.isOpen()).toBe(false);
  });

  it('should add, list, and remove members hierarchically', () => {
    // Write members
    const groupWrite = new TileDBGroup(ctx, groupUri, 'WRITE');
    groupWrite.addMember(childGroupUri, false, 'child_group_name');
    groupWrite.addMember(arrUri, false);
    groupWrite.close();

    // Read members
    const groupRead = new TileDBGroup(ctx, groupUri, 'READ');
    expect(groupRead.getMemberCount()).toBe(2);

    const member0 = groupRead.getMemberByIndex(0);
    const member1 = groupRead.getMemberByIndex(1);

    expect(['GROUP', 'ARRAY']).toContain(member0.type);
    expect(['GROUP', 'ARRAY']).toContain(member1.type);

    if(member0.type === 'GROUP') {
        expect(member0.name).toBe('child_group_name');
    } else {
        expect(member1.name).toBe('child_group_name');
    }
    groupRead.close();

    // Remove members
    const groupRemove = new TileDBGroup(ctx, groupUri, 'WRITE');
    groupRemove.removeMember('child_group_name');
    groupRemove.close();

    const groupReadAgain = new TileDBGroup(ctx, groupUri, 'READ');
    expect(groupReadAgain.getMemberCount()).toBe(1);
    groupReadAgain.close();
  });

  it('should support metadata operations matching array semantics', () => {
    const groupWrite = new TileDBGroup(ctx, groupUri, 'WRITE');
    groupWrite.putMetadata('test_key', 'FLOAT64', 3.1415);
    groupWrite.close();

    const groupRead = new TileDBGroup(ctx, groupUri, 'READ');
    expect(groupRead.getMetadataNum()).toBe(1);
    expect(groupRead.getMetadata('test_key')).toBeCloseTo(3.1415);
    
    const metaByIndex = groupRead.getMetadataByIndex(0);
    expect(metaByIndex.key).toBe('test_key');
    expect(metaByIndex.type).toBe('FLOAT64');

    groupRead.close();

    const groupDelete = new TileDBGroup(ctx, groupUri, 'WRITE');
    groupDelete.deleteMetadata('test_key');
    groupDelete.close();

    const groupReadFinal = new TileDBGroup(ctx, groupUri, 'READ');
    expect(groupReadFinal.getMetadataNum()).toBe(0);
    groupReadFinal.close();
  });
});
