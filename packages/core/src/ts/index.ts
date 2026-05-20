import { writeFileSync } from 'fs';
import { nativeData } from './native';
import { TileDBError } from './error';
import { Context } from './context';
import { Config } from './config';
import { Dimension } from './dimension';
import { Domain } from './domain';
import { Attribute } from './attribute';
import { ArraySchema } from './array_schema';
import { TileDBArray } from './array';
import { Subarray } from './subarray';
import { Query } from './query';
import { QueryCondition } from './query_condition';
import { TileDBObject } from './object';
import { TileDBGroup } from './group';
import { Filter } from './filter';
import { FilterList } from './filter_list';
import { VFS } from './vfs';
import { FragmentInfo } from './fragment_info';
import { Enumeration } from './enumeration';
import { ArraySchemaEvolution } from './schema_evolution';
import { ConsolidationPlan } from './consolidation_plan';

export { TileDBError } from './error';
export type { Datatype, FilterType, Layout, ArrayType, QueryStatus, QueryType, ObjectOrder, QueryConditionOp, QueryConditionCombinationOp, VFSMode } from './types';
export type { TileDBVersion, MetadataValue } from './bindings';

export { Context } from './context';
export { Config } from './config';
export { Dimension } from './dimension';
export { Domain } from './domain';
export { Attribute } from './attribute';
export { ArraySchema } from './array_schema';
export { TileDBArray } from './array';
export { Subarray } from './subarray';
export { Query } from './query';
export { QueryCondition } from './query_condition';
export { TileDBObject } from './object';
export { TileDBGroup } from './group';
export { Filter } from './filter';
export { FilterList } from './filter_list';
export { VFS } from './vfs';
export { FragmentInfo } from './fragment_info';
export { Enumeration } from './enumeration';
export { ArraySchemaEvolution } from './schema_evolution';
export { ConsolidationPlan } from './consolidation_plan';

export const Stats = {
  enable: () => { nativeData!.Stats.enable(); },
  disable: () => { nativeData!.Stats.disable(); },
  reset: () => { nativeData!.Stats.reset(); },
  dumpStr: () => { return nativeData!.Stats.dumpStr(); },
  dump: (filePath: string) => {
    const stats = nativeData!.Stats.dumpStr();
    writeFileSync(filePath, stats, 'utf-8');
  }
};

function rethrowAsTileDBError(e: any): never {
  if (e && e.name !== 'TileDBError' && typeof e.message === 'string' && e.message.includes('[TileDB::')) {
    const tde = new TileDBError(e.message);
    tde.stack = e.stack;
    throw tde;
  }
  throw e;
}

function wrapErrors(target: any, prop: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  if (typeof original !== 'function') return;
  descriptor.value = function(...args: any[]) {
    try {
      const res = original.apply(this, args);
      if (res && typeof res.catch === 'function') {
        return res.catch((e: any) => rethrowAsTileDBError(e));
      }
      return res;
    } catch (e: any) {
      rethrowAsTileDBError(e);
    }
  };
}

function wrapGetter(target: any, prop: string, descriptor: PropertyDescriptor) {
  if (!descriptor.get) return;
  const originalGet = descriptor.get;
  descriptor.get = function() {
    try {
      return originalGet.apply(this);
    } catch(e: any) {
      rethrowAsTileDBError(e);
    }
  };
}

const exportedClasses = [Context, Config, Filter, FilterList, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Subarray, Query, QueryCondition, TileDBObject, TileDBGroup, VFS, FragmentInfo, Enumeration, ArraySchemaEvolution, ConsolidationPlan];

exportedClasses.forEach(ctor => {
  const proto = ctor.prototype;
  for (const prop of Object.getOwnPropertyNames(proto)) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc && typeof desc.value === 'function' && prop !== 'constructor') {
      wrapErrors(proto, prop, desc);
    }
    if (desc && desc.get) {
      wrapGetter(proto, prop, desc);
    }
    if (desc) Object.defineProperty(proto, prop, desc);
  }

  for (const prop of Object.getOwnPropertyNames(ctor)) {
    const desc = Object.getOwnPropertyDescriptor(ctor, prop);
    if (desc && typeof desc.value === 'function' && prop !== 'name' && prop !== 'length' && prop !== 'prototype') {
      wrapErrors(ctor, prop, desc);
    }
    if (desc) Object.defineProperty(ctor, prop, desc);
  }
});
