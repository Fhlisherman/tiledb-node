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
  NativeVFS,
  NativeFragmentInfo,
  NativeEnumeration,
  NativeArraySchemaEvolution,
  NativeConsolidationPlan,
  TileDBVersion
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


export type Datatype = 'INT32' | 'INT64' | 'FLOAT32' | 'FLOAT64' | 'CHAR' | 'INT8' | 'UINT8' | 'INT16' | 'UINT16' | 'UINT32' | 'UINT64' | 'STRING_ASCII' | 'STRING_UTF8' | 'STRING_UTF16' | 'STRING_UTF32' | 'STRING_UCS2' | 'STRING_UCS4' | 'ANY' | 'DATETIME_YEAR' | 'DATETIME_MONTH' | 'DATETIME_WEEK' | 'DATETIME_DAY' | 'DATETIME_HR' | 'DATETIME_MIN' | 'DATETIME_SEC' | 'DATETIME_MS' | 'DATETIME_US' | 'DATETIME_NS' | 'DATETIME_PS' | 'DATETIME_FS' | 'DATETIME_AS' | 'TIME_HR' | 'TIME_MIN' | 'TIME_SEC' | 'TIME_MS' | 'TIME_US' | 'TIME_NS' | 'TIME_PS' | 'TIME_FS' | 'TIME_AS' | 'BLOB';
export type FilterType = 'NONE' | 'GZIP' | 'ZSTD' | 'LZ4' | 'RLE' | 'BZIP2' | 'DOUBLE_DELTA' | 'BIT_WIDTH_REDUCTION' | 'BITSHUFFLE' | 'BYTESHUFFLE' | 'POSITIVE_DELTA';
export type Layout = 'ROW_MAJOR' | 'COL_MAJOR' | 'GLOBAL_ORDER' | 'UNORDERED';
export type ArrayType = 'DENSE' | 'SPARSE';
export type QueryStatus = 'FAILED' | 'COMPLETED' | 'INPROGRESS' | 'INCOMPLETE' | 'UNINITIALIZED';
export type QueryType = 'READ' | 'WRITE' | 'DELETE' | 'UPDATE' | 'MODIFY_EXCLUSIVE';
export type ObjectOrder = 'PREORDER' | 'POSTORDER';
export type QueryConditionOp = 'LT' | 'LE' | 'GT' | 'GE' | 'EQ' | 'NEQ';
export type QueryConditionCombinationOp = 'AND' | 'OR' | 'NOT';
export type VFSMode = 'read' | 'write' | 'append' | 'READ' | 'WRITE' | 'APPEND';


/**
 * Represents a TileDB Context.
 * A Context encapsulates the TileDB state and configuration.
 */
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

/**
 * Represents a TileDB Configuration.
 * Used to set various parameters for the TileDB engine.
 */
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

/**
 * Represents a TileDB Dimension.
 * Dimensions define the axes of a TileDB array.
 */
export class Dimension {
  private nativeDimension: NativeDimension | null;

  constructor(ctx: Context, name: string, datatype: Datatype, domainLow: number, domainHigh: number, tileExtent: number) {
    this.nativeDimension = new nativeData!.Dimension(ctx.native, name, datatype, domainLow, domainHigh, tileExtent);
  }

  public get native(): NativeDimension {
    if (!this.nativeDimension) throw new Error('Dimension closed');
    return this.nativeDimension;
  }

  public name(): string { return this.native.name(); }
  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }
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

/**
 * Represents a TileDB Domain.
 * A Domain is a collection of dimensions defining the bounds of a TileDB array.
 */
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

  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }
  public ndim(): number { return this.native.ndim(); }
  public dimensions(): any[] { return this.native.dimensions(); }

  public close(): void {
    if (this.nativeDomain) {
      this.nativeDomain.close();
      this.nativeDomain = null;
    }
  }
}

/**
 * Represents a TileDB Attribute.
 * Attributes are the values stored in the cells of a TileDB array.
 */
export class Attribute {
  private nativeAttribute: NativeAttribute | null;

  constructor(ctx: Context, name: string, datatype: Datatype) {
    this.nativeAttribute = new nativeData!.Attribute(ctx.native, name, datatype);
  }

  public get native(): NativeAttribute {
    if (!this.nativeAttribute) throw new Error('Attribute closed');
    return this.nativeAttribute;
  }

  public name(): string { return this.native.name(); }
  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }
  public cellValNum(): number { return this.native.cellValNum(); }
  public setCellValNum(num: number): void { this.native.setCellValNum(num); }
  public setNullable(nullable: boolean): void { this.native.setNullable(nullable); }
  public nullable(): boolean { return this.native.nullable(); }

  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  public setEnumerationName(ctx: Context, name: string): void {
    this.native.setEnumerationName(ctx.native, name);
  }

  public close(): void {
    if (this.nativeAttribute) {
      this.nativeAttribute.close();
      this.nativeAttribute = null;
    }
  }
}

/**
 * Represents a TileDB Array Schema.
 * Describes the structure of a TileDB array including domain, attributes, and cell/tile orders.
 */
export class ArraySchema {
  private nativeSchema: NativeArraySchema | null;

  constructor(ctx: Context, arrayType: ArrayType) {
    this.nativeSchema = new nativeData!.ArraySchema(ctx.native, arrayType);
  }

  public get native(): NativeArraySchema {
    if (!this.nativeSchema) throw new Error('ArraySchema closed');
    return this.nativeSchema;
  }

  public setDomain(domain: Domain): void { this.native.setDomain(domain.native); }
  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  public setCellOrder(layout: Layout): void { this.native.setCellOrder(layout); }
  public setTileOrder(layout: Layout): void { this.native.setTileOrder(layout); }
  public setCapacity(capacity: number): void { this.native.setCapacity(capacity); }
  public setAllowsDups(allows: boolean): void { this.native.setAllowsDups(allows); }
  public check(): boolean { return this.native.check(); }
  public arrayType(): ArrayType { return this.native.arrayType() as ArrayType; }
  public attributeCount(): number { return this.native.attributeCount(); }

  public addEnumeration(ctx: Context, enmr: Enumeration): void {
    this.native.addEnumeration(ctx.native, enmr.native);
  }

  public addDimensionLabel(ctx: Context, dimIdx: number, name: string, labelOrder: string, labelType: string): void {
    this.native.addDimensionLabel(ctx.native, dimIdx, name, labelOrder, labelType);
  }

  public close(): void {
    if (this.nativeSchema) {
      this.nativeSchema.close();
      this.nativeSchema = null;
    }
  }
}

/**
 * Represents a TileDB Array.
 * Provides methods to create, open, read, write, and manage arrays.
 */
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

  constructor(ctx: Context, uri: string, queryType?: QueryType) {
    this.nativeArray = new nativeData!.Array(ctx.native, uri, queryType);
  }

  public get native(): NativeArray {
    if (!this.nativeArray) throw new Error('Array closed');
    return this.nativeArray;
  }

  public open(queryType: QueryType): Promise<void> {
    return this.native.open(queryType);
  }

  public close(): void {
    if (this.nativeArray) {
      this.nativeArray.close();
      this.nativeArray = null;
    }
  }

  public queryType(): QueryType { return this.native.queryType() as QueryType; }
  public uri(): string { return this.native.uri(); }
  public isOpen(): boolean { return this.nativeArray ? this.nativeArray.isOpen() : false; }
  public schema(): any { return this.native.schema(); }

  public putMetadata(key: string, datatype: Datatype, value: any): void {
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

/**
 * Represents a TileDB Subarray.
 * Used to specify the subset of an array to read from or write to.
 */
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

/**
 * Represents a TileDB Query.
 * Used to submit read and write operations to a TileDB array.
 */
export class Query {
  private nativeQuery: NativeQuery | null;

  constructor(ctx: Context, array: TileDBArray, queryType: QueryType) {
    this.nativeQuery = new nativeData!.Query(ctx.native, array.native, queryType);
  }

  public get native(): NativeQuery {
    if (!this.nativeQuery) throw new Error('Query closed');
    return this.nativeQuery;
  }

  public setLayout(layout: Layout): void {
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

  public addUpdateValue(attribute: string, value: any, datatype: Datatype): void {
    this.native.addUpdateValue(attribute, value, datatype);
  }

  public submit(): string {
    return this.native.submit();
  }

  public async submitAsync(): Promise<string> {
    return this.native.submitAsync();
  }

  public queryStatus(): QueryStatus {
    return this.native.queryStatus() as QueryStatus;
  }
  
  public resultBufferElements(): Record<string, { first: number, second: number }> {
    return this.native.resultBufferElements();
  }

  public applyAggregate(outputName: string, operationName: string, inputName?: string): void {
    this.native.applyAggregate(outputName, operationName, inputName);
  }

  public getStats(): string {
    return this.native.stats();
  }

  public close(): void {
    if (this.nativeQuery) {
      this.nativeQuery.close();
      this.nativeQuery = null;
    }
  }
}

/**
 * Represents a TileDB Query Condition.
 * Used to filter data during read operations.
 */
export class QueryCondition {
  private nativeQC: NativeQueryCondition | null;

  public static create(ctx: Context, attribute: string, value: ArrayBufferView, op: QueryConditionOp): QueryCondition {
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

  public init(attribute: string, value: ArrayBufferView, op: QueryConditionOp): void {
    this.native.init(attribute, value, op);
  }

  public combine(qc: QueryCondition, op: QueryConditionCombinationOp): QueryCondition {
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

/**
 * Provides utility methods for managing TileDB objects (arrays, groups) in the VFS.
 */
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

  public static walk(ctx: Context, uri: string, order: ObjectOrder, callback?: (type: string, uri: string) => void): { type: string, uri: string }[] {
    const results = nativeData!.TileDBObject.walk(ctx.native, uri, order);
    if (callback) {
      for (const res of results) {
        callback(res.type, res.uri);
      }
    }
    return results;
  }
}

/**
 * Represents a TileDB Group.
 * Groups are collections of TileDB arrays and other groups.
 */
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

  constructor(ctx: Context, uri: string, queryType?: QueryType) {
    this.nativeGroup = new nativeData!.Group(ctx.native, uri, queryType);
  }

  public get native(): NativeGroup {
    if (!this.nativeGroup) throw new Error('Group closed');
    return this.nativeGroup;
  }

  public open(queryType: QueryType): void {
    this.native.open(queryType);
  }

  public close(): void {
    if (this.nativeGroup) {
      this.nativeGroup.close();
      this.nativeGroup = null;
    }
  }

  public isOpen(): boolean { return this.nativeGroup ? this.nativeGroup.isOpen() : false; }
  public uri(): string { return this.native.uri(); }
  public queryType(): QueryType { return this.native.queryType() as QueryType; }

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

  public putMetadata(key: string, datatype: Datatype, value: any): void {
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

/**
 * Represents a TileDB Filter List.
 * A pipeline of filters applied to array data during reads/writes.
 */
/**
 * Represents a TileDB Filter.
 * e.g., Compression, encryption, etc.
 */
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

  constructor(ctx: Context, filterType: FilterType) {
    this.nativeFilter = new nativeData!.Filter(ctx.native, filterType);
  }

  public get native(): NativeFilter {
    if (!this.nativeFilter) throw new Error('Filter closed');
    return this.nativeFilter;
  }

  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }

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

/**
 * Represents a TileDB Virtual File System (VFS).
 * Provides file system abstraction over local, S3, HDFS, etc.
 */
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

  public open(uri: string, mode: VFSMode): void {
    this.native.open(uri, mode);
  }

  public read(offset: number, size: number): Buffer {
    return this.native.read(offset, size);
  }

  public write(buffer: Buffer): void {
    this.native.write(buffer);
  }

  /** Close the currently-open file handle (not the VFS instance). */
  public closeFile(): void {
    this.native.close();
  }

  /** Destroy the VFS instance and release all resources. */
  public close(): void {
    if (this.nativeVFS) {
      this.nativeVFS.close();
      this.nativeVFS = null;
    }
  }
}

/**
 * Represents TileDB Fragment Information.
 * Provides metadata about the fragments in a TileDB array.
 */
export class FragmentInfo {
  private nativeFI: NativeFragmentInfo;

  constructor(ctx: Context, uri: string) {
    this.nativeFI = new nativeData!.FragmentInfo(ctx.native, uri);
  }

  public get native(): NativeFragmentInfo { return this.nativeFI; }

  public load(): void { this.native.load(); }
  public fragmentNum(): number { return this.native.fragmentNum(); }
  public fragmentUri(fid: number): string { return this.native.fragmentUri(fid); }
  public fragmentSize(fid: number): bigint | number { return this.native.fragmentSize(fid); }
  public timestampRange(fid: number): [number, number] { return this.native.timestampRange(fid); }
  public mbrNum(fid: number): number { return this.native.mbrNum(fid); }
}

/**
 * Represents a TileDB Enumeration.
 * Used for dictionary-encoded string attributes.
 */
export class Enumeration {
  private nativeEnumeration: NativeEnumeration;

  public static create(ctx: Context, name: string, datatype: Datatype, values: any[]): Enumeration {
    return new Enumeration(nativeData!.Enumeration.create(ctx.native, name, datatype, values));
  }

  private constructor(nativeEnmr: NativeEnumeration) {
    this.nativeEnumeration = nativeEnmr;
  }

  public get native(): NativeEnumeration {
    return this.nativeEnumeration;
  }

  public name(): string { return this.native.name(); }
  public type(): number { return this.native.type(); }
}

/**
 * Represents a TileDB Array Schema Evolution.
 * Used to evolve the schema of an existing TileDB array.
 */
export class ArraySchemaEvolution {
  private nativeEvolution: NativeArraySchemaEvolution;

  constructor(ctx: Context) {
    this.nativeEvolution = new nativeData!.ArraySchemaEvolution(ctx.native);
  }

  public get native(): NativeArraySchemaEvolution {
    return this.nativeEvolution;
  }

  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  public dropAttribute(name: string): void { this.native.dropAttribute(name); }
  public addEnumeration(enmr: Enumeration): void { this.native.addEnumeration(enmr.native); }
  public dropEnumeration(name: string): void { this.native.dropEnumeration(name); }
  public extendEnumeration(enmr: Enumeration): void { this.native.extendEnumeration(enmr.native); }
  public arrayEvolve(uri: string): void { this.native.arrayEvolve(uri); }
}

/**
 * Represents a TileDB Consolidation Plan.
 * Provides a plan for consolidating fragments in an array.
 */
export class ConsolidationPlan {
  private nativePlan: NativeConsolidationPlan;

  constructor(ctx: Context, array: TileDBArray, fragmentSize: number) {
    this.nativePlan = new nativeData!.ConsolidationPlan(ctx.native, array.native, fragmentSize);
  }

  public get native(): NativeConsolidationPlan {
    return this.nativePlan;
  }

  public numNodes(): number { return this.native.numNodes(); }
  public numFragments(nodeIdx: number): number { return this.native.numFragments(nodeIdx); }
  public fragmentUri(nodeIdx: number, fragIdx: number): string { return this.native.fragmentUri(nodeIdx, fragIdx); }
  public dump(): string { return this.native.dump(); }
}

export const Stats = {
  enable: () => { nativeData!.Stats.enable(); },
  disable: () => { nativeData!.Stats.disable(); },
  reset: () => { nativeData!.Stats.reset(); },
  dumpStr: () => { return nativeData!.Stats.dumpStr(); }
};

export type { TileDBVersion };

const exportedClasses = [Context, Config, Filter, FilterList, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Subarray, Query, QueryCondition, TileDBObject, TileDBGroup, VFS, FragmentInfo, Enumeration, ArraySchemaEvolution, ConsolidationPlan];

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
