import type {
  NativeContext,
  NativeConfig,
  NativeFilter,
  NativeFilterList,
  NativeDimension,
  NativeDomain,
  NativeAttribute,
  NativeArraySchema,
  NativeArray,
  NativeSubarray,
  NativeQueryCondition,
  NativeQuery,
  TileDBNativeBindings,
  NativeGroup,
  NativeVFS
} from './bindings';

let nativeData: TileDBNativeBindings | undefined;

const platform = process.platform;
const arch = process.arch;

if (platform === 'darwin' && arch === 'arm64') {
  nativeData = require('@tiledb-node/darwin-arm64');
} else if (platform === 'darwin' && arch === 'x64') {
  nativeData = require('@tiledb-node/darwin-x64');
} else if (platform === 'linux' && arch === 'arm64') {
  nativeData = require('@tiledb-node/linux-arm64');
} else if (platform === 'linux' && arch === 'x64') {
  nativeData = require('@tiledb-node/linux-x64');
} else if (platform === 'win32' && arch === 'x64') {
  nativeData = require('@tiledb-node/win32-x64');
} else {
  throw new Error(`Unsupported OS/Architecture combination: ${platform}-${arch}`);
}

if (!nativeData) {
  throw new Error(`Failed to load TileDB native bindings for ${platform}-${arch}. Ensure the optional dependency is installed.`);
}

export class TileDBError extends Error {
  public component?: string;
  public details?: string;

  constructor(message: string) {
    super(message);
    this.name = 'TileDBError';
    Object.setPrototypeOf(this, new.target.prototype);

    const match = message.match(/\[TileDB::(.*?)\]\s+Error:\s+(.*)/i);
    if (match) {
      this.component = match[1].trim();
      this.details = match[2].trim();
    }
  }
}

export class Context {
  // @ts-ignore
  private nativeContext: NativeContext | null;

  constructor(config?: Config) {
    this.nativeContext = new nativeData!.Context(config?.native);
  }

  public get native(): NativeContext {
    if (!this.nativeContext) throw new Error('Context already closed');
    return this.nativeContext;
  }

  public getVersion(): TileDBVersion {
    if (!this.nativeContext) throw new Error('Context already closed');
    return this.nativeContext.getVersion();
  }

  public close(): void {
    if (this.nativeContext) {
      this.nativeContext.close();
      this.nativeContext = null;
    }
  }
}

export class Config {
  private nativeConfig: NativeConfig | null;

  constructor() {
    this.nativeConfig = new nativeData!.Config();
  }

  public get native(): NativeConfig {
    if (!this.nativeConfig) throw new Error('Config closed');
    return this.nativeConfig;
  }

  public set(param: string, value: string): void {
    if (!this.nativeConfig) throw new Error('Config closed');
    this.nativeConfig.set(param, value);
  }

  public get(param: string): string {
    if (!this.nativeConfig) throw new Error('Config closed');
    return this.nativeConfig.get(param);
  }

  public unset(param: string): void {
    if (!this.nativeConfig) throw new Error('Config closed');
    this.nativeConfig.unset(param);
  }

  public close(): void {
    if (this.nativeConfig) {
      this.nativeConfig.close();
      this.nativeConfig = null;
    }
  }
}

export class Dimension {
  private nativeDimension: NativeDimension | null;

  constructor(ctx: Context, name: string, datatype: string, domainLow: number, domainHigh: number, tileExtent: number) {
    this.nativeDimension = new nativeData!.Dimension(ctx.native, name, datatype, domainLow, domainHigh, tileExtent);
  }

  public get native(): NativeDimension {
    if (!this.nativeDimension) throw new Error('Dimension closed');
    return this.nativeDimension;
  }

  public name(): string { return this.native.name(); }
  public type(): string { return this.native.type(); }
  public domain(): string { return this.native.domain(); }
  public tileExtent(): string { return this.native.tileExtent(); }

  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  public close(): void {
    if (this.nativeDimension) {
      this.nativeDimension.close();
      this.nativeDimension = null;
    }
  }
}

export class Domain {
  private nativeDomain: NativeDomain | null;

  constructor(ctx: Context) {
    this.nativeDomain = new nativeData!.Domain(ctx.native);
  }

  public get native(): NativeDomain {
    if (!this.nativeDomain) throw new Error('Domain closed');
    return this.nativeDomain;
  }

  public addDimension(dim: Dimension): void {
    this.native.addDimension(dim.native);
  }

  public type(): string { return this.native.type(); }
  public ndim(): number { return this.native.ndim(); }
  public dimensions(): any[] { return this.native.dimensions(); }

  public close(): void {
    if (this.nativeDomain) {
      this.nativeDomain.close();
      this.nativeDomain = null;
    }
  }
}

export class Attribute {
  private nativeAttribute: NativeAttribute | null;

  constructor(ctx: Context, name: string, datatype: string) {
    this.nativeAttribute = new nativeData!.Attribute(ctx.native, name, datatype);
  }

  public get native(): NativeAttribute {
    if (!this.nativeAttribute) throw new Error('Attribute closed');
    return this.nativeAttribute;
  }

  public name(): string { return this.native.name(); }
  public type(): string { return this.native.type(); }
  public cellValNum(): number { return this.native.cellValNum(); }
  public setCellValNum(num: number): void { this.native.setCellValNum(num); }
  public setNullable(nullable: boolean): void { this.native.setNullable(nullable); }
  public nullable(): boolean { return this.native.nullable(); }

  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  public close(): void {
    if (this.nativeAttribute) {
      this.nativeAttribute.close();
      this.nativeAttribute = null;
    }
  }
}

export class ArraySchema {
  private nativeSchema: NativeArraySchema | null;

  constructor(ctx: Context, arrayType: 'DENSE' | 'SPARSE') {
    this.nativeSchema = new nativeData!.ArraySchema(ctx.native, arrayType);
  }

  public get native(): NativeArraySchema {
    if (!this.nativeSchema) throw new Error('ArraySchema closed');
    return this.nativeSchema;
  }

  public setDomain(domain: Domain): void { this.native.setDomain(domain.native); }
  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  public setCellOrder(layout: string): void { this.native.setCellOrder(layout); }
  public setTileOrder(layout: string): void { this.native.setTileOrder(layout); }
  public setCapacity(capacity: number): void { this.native.setCapacity(capacity); }
  public setAllowsDups(allows: boolean): void { this.native.setAllowsDups(allows); }
  public check(): boolean { return this.native.check(); }
  public arrayType(): string { return this.native.arrayType(); }
  public attributeCount(): number { return this.native.attributeCount(); }

  public close(): void {
    if (this.nativeSchema) {
      this.nativeSchema.close();
      this.nativeSchema = null;
    }
  }
}

export class TileDBArray {
  private nativeArray: NativeArray | null;

  public static create(uri: string, schema: ArraySchema): Promise<boolean> {
    return nativeData!.Array.create(uri, schema.native);
  }

  public static consolidate(ctx: Context, uri: string, config?: Config): Promise<void> {
    return nativeData!.Array.consolidate(ctx.native, uri, config?.native);
  }

  public static vacuum(ctx: Context, uri: string, config?: Config): Promise<void> {
    return nativeData!.Array.vacuum(ctx.native, uri, config?.native);
  }

  constructor(ctx: Context, uri: string, queryType?: 'READ' | 'WRITE' | 'DELETE' | 'MODIFY_EXCLUSIVE') {
    this.nativeArray = new nativeData!.Array(ctx.native, uri, queryType);
  }

  public get native(): NativeArray {
    if (!this.nativeArray) throw new Error('Array closed');
    return this.nativeArray;
  }

  public open(queryType: 'READ' | 'WRITE' | 'DELETE' | 'MODIFY_EXCLUSIVE'): Promise<void> {
    return this.native.open(queryType);
  }

  public close(): void {
    if (this.nativeArray) {
      this.nativeArray.close();
      this.nativeArray = null;
    }
  }

  public queryType(): string { return this.native.queryType(); }
  public uri(): string { return this.native.uri(); }
  public isOpen(): boolean { return this.native.isOpen(); }
  public schema(): any { return this.native.schema(); }

  public putMetadata(key: string, datatype: string, value: any): void {
    this.native.putMetadata(key, datatype, value);
  }

  public getMetadata(key: string): any {
    return this.native.getMetadata(key);
  }

  public deleteMetadata(key: string): void {
    this.native.deleteMetadata(key);
  }

  public getMetadataNum(): number {
    return this.native.getMetadataNum();
  }

  public getMetadataByIndex(index: number): { key: string, type: string, value: any } {
    return this.native.getMetadataByIndex(index);
  }
}

export class Subarray {
  private nativeSubarray: NativeSubarray | null;

  constructor(ctx: Context, array: TileDBArray) {
    this.nativeSubarray = new nativeData!.Subarray(ctx.native, array.native);
  }

  public get native(): NativeSubarray {
    if (!this.nativeSubarray) throw new Error('Subarray closed');
    return this.nativeSubarray;
  }

  public addRange(dimName: string, start: number, end: number): void {
    this.native.addRange(dimName, start, end);
  }

  public close(): void {
    if (this.nativeSubarray) {
      this.nativeSubarray.close();
      this.nativeSubarray = null;
    }
  }
}

export class Query {
  private nativeQuery: NativeQuery | null;

  constructor(ctx: Context, array: TileDBArray, queryType: 'READ' | 'WRITE' | 'DELETE' | 'UPDATE' | 'MODIFY_EXCLUSIVE') {
    this.nativeQuery = new nativeData!.Query(ctx.native, array.native, queryType);
  }

  public get native(): NativeQuery {
    if (!this.nativeQuery) throw new Error('Query closed');
    return this.nativeQuery;
  }

  public setLayout(layout: 'ROW_MAJOR' | 'COL_MAJOR' | 'GLOBAL_ORDER' | 'UNORDERED'): void {
    this.native.setLayout(layout);
  }

  public setSubarray(subarray: Subarray): void {
    this.native.setSubarray(subarray.native);
  }

  public setCondition(condition: QueryCondition): void {
    this.native.setCondition(condition.native);
  }

  public setDataBuffer(attribute: string, buffer: ArrayBufferView | string[]): void {
    if (Array.isArray(buffer)) {
      const encoder = new TextEncoder();
      const encodedStrings = buffer.map(str => encoder.encode(str));
      const totalBytes = encodedStrings.reduce((acc, curr) => acc + curr.length, 0);

      const offsets = new BigUint64Array(buffer.length);
      const dataBuffer = new Uint8Array(totalBytes);

      let currentOffset = 0;
      for (let i = 0; i < encodedStrings.length; i++) {
        offsets[i] = BigInt(currentOffset);
        dataBuffer.set(encodedStrings[i], currentOffset);
        currentOffset += encodedStrings[i].length;
      }

      this.native.setOffsetsBuffer(attribute, offsets);
      this.native.setDataBuffer(attribute, dataBuffer);
    } else {
      this.native.setDataBuffer(attribute, buffer);
    }
  }

  public setOffsetsBuffer(attribute: string, buffer: BigUint64Array | BigInt64Array): void {
    this.native.setOffsetsBuffer(attribute, buffer);
  }

  public setValidityBuffer(attribute: string, buffer: Uint8Array): void {
    this.native.setValidityBuffer(attribute, buffer);
  }

  public addUpdateValue(attribute: string, value: any, datatype: string): void {
    this.native.addUpdateValue(attribute, value, datatype);
  }

  public submit(): string {
    return this.native.submit();
  }

  public async submitAsync(): Promise<string> {
    return this.native.submitAsync();
  }

  public queryStatus(): string {
    return this.native.queryStatus();
  }
  
  public resultBufferElements(): Record<string, { first: number, second: number }> {
    return this.native.resultBufferElements();
  }

  public close(): void {
    if (this.nativeQuery) {
      this.nativeQuery.close();
      this.nativeQuery = null;
    }
  }
}

export class QueryCondition {
  private nativeQC: NativeQueryCondition | null;

  public static create(ctx: Context, attribute: string, value: ArrayBufferView, op: 'LT' | 'LE' | 'GT' | 'GE' | 'EQ' | 'NEQ'): QueryCondition {
    const qc = new QueryCondition(ctx);
    qc.init(attribute, value, op);
    return qc;
  }

  constructor(ctx: Context) {
    this.nativeQC = new nativeData!.QueryCondition(ctx.native);
  }

  public get native(): NativeQueryCondition {
    if (!this.nativeQC) throw new Error('QueryCondition closed');
    return this.nativeQC;
  }

  public init(attribute: string, value: ArrayBufferView, op: 'LT' | 'LE' | 'GT' | 'GE' | 'EQ' | 'NEQ'): void {
    this.native.init(attribute, value, op);
  }

  public combine(qc: QueryCondition, op: 'AND' | 'OR' | 'NOT'): QueryCondition {
    const combinedNative = this.native.combine(qc.native, op);
    // Wrap the returned native object
    const newQc = Object.create(QueryCondition.prototype);
    newQc.nativeQC = combinedNative;
    return newQc;
  }

  public negate(): QueryCondition {
    const negatedNative = this.native.negate();
    const newQc = Object.create(QueryCondition.prototype);
    newQc.nativeQC = negatedNative;
    return newQc;
  }
}

export class TileDBObject {
  public static type(ctx: Context, uri: string): string {
    return nativeData!.TileDBObject.type(ctx.native, uri);
  }

  public static remove(ctx: Context, uri: string): void {
    nativeData!.TileDBObject.remove(ctx.native, uri);
  }

  public static move(ctx: Context, oldUri: string, newUri: string): void {
    nativeData!.TileDBObject.move(ctx.native, oldUri, newUri);
  }

  public static ls(ctx: Context, uri: string, callback?: (type: string, uri: string) => void): { type: string, uri: string }[] {
    const results = nativeData!.TileDBObject.ls(ctx.native, uri);
    if (callback) {
      for (const res of results) {
        callback(res.type, res.uri);
      }
    }
    return results;
  }

  public static walk(ctx: Context, uri: string, order: 'PREORDER' | 'POSTORDER', callback?: (type: string, uri: string) => void): { type: string, uri: string }[] {
    const results = nativeData!.TileDBObject.walk(ctx.native, uri, order);
    if (callback) {
      for (const res of results) {
        callback(res.type, res.uri);
      }
    }
    return results;
  }
}

export class TileDBGroup {
  private nativeGroup: NativeGroup | null;

  public static create(ctx: Context, uri: string): boolean {
    return nativeData!.Group.create(ctx.native, uri);
  }

  public static consolidate(ctx: Context, uri: string, config?: Config): void {
    nativeData!.Group.consolidate(ctx.native, uri, config?.native);
  }

  public static vacuum(ctx: Context, uri: string, config?: Config): void {
    nativeData!.Group.vacuum(ctx.native, uri, config?.native);
  }

  constructor(ctx: Context, uri: string, queryType?: 'READ' | 'WRITE' | 'DELETE' | 'MODIFY_EXCLUSIVE') {
    this.nativeGroup = new nativeData!.Group(ctx.native, uri, queryType);
  }

  public get native(): NativeGroup {
    if (!this.nativeGroup) throw new Error('Group closed');
    return this.nativeGroup;
  }

  public open(queryType: 'READ' | 'WRITE' | 'DELETE' | 'MODIFY_EXCLUSIVE'): void {
    this.native.open(queryType);
  }

  public close(): void {
    if (this.nativeGroup) {
      this.nativeGroup.close();
      this.nativeGroup = null;
    }
  }

  public isOpen(): boolean { return this.native.isOpen(); }
  public uri(): string { return this.native.uri(); }
  public queryType(): string { return this.native.queryType(); }

  public addMember(uri: string, relative?: boolean, name?: string): void {
    this.native.addMember(uri, relative, name);
  }

  public removeMember(name_or_uri: string): void {
    this.native.removeMember(name_or_uri);
  }

  public getMemberCount(): number {
    return this.native.getMemberCount();
  }

  public getMemberByIndex(index: number): { uri: string, type: string, name: string | null } {
    return this.native.getMemberByIndex(index);
  }

  public putMetadata(key: string, datatype: string, value: any): void {
    this.native.putMetadata(key, datatype, value);
  }

  public getMetadata(key: string): any {
    return this.native.getMetadata(key);
  }

  public deleteMetadata(key: string): void {
    this.native.deleteMetadata(key);
  }

  public getMetadataNum(): number {
    return this.native.getMetadataNum();
  }

  public getMetadataByIndex(index: number): { key: string, type: string, value: any } {
    return this.native.getMetadataByIndex(index);
  }
}

export class FilterList {
  private nativeFilterList: NativeFilterList | null;

  constructor(ctx: Context) {
    this.nativeFilterList = new nativeData!.FilterList(ctx.native);
  }

  public get native(): NativeFilterList {
    if (!this.nativeFilterList) throw new Error('FilterList closed');
    return this.nativeFilterList;
  }

  public addFilter(filter: Filter): FilterList {
    this.native.addFilter(filter.native);
    return this;
  }

  public setChunkSize(size: number): FilterList {
    this.native.setChunkSize(size);
    return this;
  }

  public close(): void {
    if (this.nativeFilterList) {
      this.nativeFilterList.close();
      this.nativeFilterList = null;
    }
  }
}

export class Filter {
  private nativeFilter: NativeFilter | null;

  constructor(ctx: Context, filterType: string) {
    this.nativeFilter = new nativeData!.Filter(ctx.native, filterType);
  }

  public get native(): NativeFilter {
    if (!this.nativeFilter) throw new Error('Filter closed');
    return this.nativeFilter;
  }

  public type(): string { return this.native.type(); }

  public setOption(option: string, value: number): Filter {
    this.native.setOption(option, value);
    return this;
  }

  public close(): void {
    if (this.nativeFilter) {
      this.nativeFilter.close();
      this.nativeFilter = null;
    }
  }
}

export class VFS {
  private nativeVFS: NativeVFS | null;

  constructor(ctx: Context, config?: Config) {
    this.nativeVFS = new nativeData!.VFS(ctx.native, config?.native);
  }

  public get native(): NativeVFS {
    if (!this.nativeVFS) throw new Error('VFS closed');
    return this.nativeVFS;
  }

  public createBucket(uri: string): void { this.native.createBucket(uri); }
  public removeBucket(uri: string): void { this.native.removeBucket(uri); }
  public isBucket(uri: string): boolean { return this.native.isBucket(uri); }
  public emptyBucket(uri: string): void { this.native.emptyBucket(uri); }
  public isEmptyBucket(uri: string): boolean { return this.native.isEmptyBucket(uri); }
  
  public createDir(uri: string): void { this.native.createDir(uri); }
  public isDir(uri: string): boolean { return this.native.isDir(uri); }
  public removeDir(uri: string): void { this.native.removeDir(uri); }
  public dirSize(uri: string): number { return this.native.dirSize(uri); }

  public isFile(uri: string): boolean { return this.native.isFile(uri); }
  public removeFile(uri: string): void { this.native.removeFile(uri); }
  public fileSize(uri: string): number { return this.native.fileSize(uri); }
  
  public ls(uri: string): string[] { return this.native.ls(uri); }

  public moveFile(oldUri: string, newUri: string): void { this.native.moveFile(oldUri, newUri); }
  public moveDir(oldUri: string, newUri: string): void { this.native.moveDir(oldUri, newUri); }
  public copyFile(oldUri: string, newUri: string): void { this.native.copyFile(oldUri, newUri); }
  public copyDir(oldUri: string, newUri: string): void { this.native.copyDir(oldUri, newUri); }
  
  public touch(uri: string): void { this.native.touch(uri); }

  public open(uri: string, mode: 'read' | 'write' | 'append' | 'READ' | 'WRITE' | 'APPEND'): void {
    this.native.open(uri, mode);
  }

  public read(offset: number, size: number): Buffer {
    return this.native.read(offset, size);
  }

  public write(buffer: Buffer): void {
    this.native.write(buffer);
  }

  public close(): void {
    if (this.nativeVFS) {
      this.nativeVFS.close();
      this.nativeVFS = null;
    }
  }
}

export { TileDBVersion };

const exportedClasses = [Context, Config, Filter, FilterList, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Subarray, Query, QueryCondition, TileDBObject, TileDBGroup, VFS];

exportedClasses.forEach(ctor => {
  const proto = ctor.prototype;
  for (const prop of Object.getOwnPropertyNames(proto)) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc && typeof desc.value === 'function' && prop !== 'constructor') {
      const original = desc.value;
      (proto as any)[prop] = function(...args: any[]) {
        try {
          const res = original.apply(this, args);
          if (res && typeof res.catch === 'function') {
            return res.catch((e: any) => {
              if (e && e.name !== 'TileDBError' && typeof e.message === 'string' && e.message.includes('[TileDB::')) {
                const tde = new TileDBError(e.message);
                tde.stack = e.stack;
                throw tde;
              }
              throw e;
            });
          }
          return res;
        } catch (e: any) {
          if (e && e.name !== 'TileDBError' && typeof e.message === 'string' && e.message.includes('[TileDB::')) {
            const tde = new TileDBError(e.message);
            tde.stack = e.stack;
            throw tde;
          }
          throw e;
        }
      };
    }
    if (desc && desc.get) {
       const originalGet = desc.get;
       Object.defineProperty(proto, prop, {
           get: function() {
              try {
                  return originalGet.apply(this);
              } catch(e: any) {
                  if (e && e.name !== 'TileDBError' && typeof e.message === 'string' && e.message.includes('[TileDB::')) {
                      const tde = new TileDBError(e.message);
                      tde.stack = e.stack;
                      throw tde;
                  }
                  throw e;
              }
           },
           set: desc.set,
           enumerable: desc.enumerable,
           configurable: desc.configurable
       });
    }
  }

  for (const prop of Object.getOwnPropertyNames(ctor)) {
    const desc = Object.getOwnPropertyDescriptor(ctor, prop);
    if (desc && typeof desc.value === 'function' && prop !== 'name' && prop !== 'length' && prop !== 'prototype') {
      const original = desc.value;
      (ctor as any)[prop] = function(...args: any[]) {
        try {
          const res = original.apply(this, args);
          if (res && typeof res.catch === 'function') {
            return res.catch((e: any) => {
              if (e && e.name !== 'TileDBError' && typeof e.message === 'string' && e.message.includes('[TileDB::')) {
                const tde = new TileDBError(e.message);
                tde.stack = e.stack;
                throw tde;
              }
              throw e;
            });
          }
          return res;
        } catch (e: any) {
          if (e && e.name !== 'TileDBError' && typeof e.message === 'string' && e.message.includes('[TileDB::')) {
            const tde = new TileDBError(e.message);
            tde.stack = e.stack;
            throw tde;
          }
          throw e;
        }
      };
    }
  }
});
