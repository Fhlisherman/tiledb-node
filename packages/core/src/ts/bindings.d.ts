
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

/** Union type representing all possible TileDB metadata values. */
export type MetadataValue = string | number | bigint | null;

export interface TileDBVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface NativeEnumeration {
  name(): string;
  type(): number;
}

export interface NativeArraySchemaEvolution {
  addAttribute(attr: NativeAttribute): void;
  dropAttribute(name: string): void;
  addEnumeration(enmr: NativeEnumeration): void;
  dropEnumeration(name: string): void;
  extendEnumeration(enmr: NativeEnumeration): void;
  arrayEvolve(uri: string): void;
}

export interface NativeConsolidationPlan {
  numNodes(): number;
  numFragments(nodeIdx: number): number;
  fragmentUri(nodeIdx: number, fragIdx: number): string;
  dump(): string;
}

export declare class NativeContext {
  constructor();
  getVersion(): TileDBVersion;
  close(): void;
}

export declare class NativeConfig {
  constructor();
  set(param: string, value: string): void;
  get(param: string): string;
  unset(param: string): void;
  close(): void;
}

export declare class NativeFilter {
  constructor(ctx: NativeContext, filterType: FilterType);
  type(): Datatype | FilterType | ArrayType | string;
  setOption(option: string, value: number): void;
  close(): void;
}

export declare class NativeFilterList {
  constructor(ctx: NativeContext);
  addFilter(filter: NativeFilter): void;
  setChunkSize(size: number): void;
  close(): void;
}

export declare class NativeDimension {
  constructor(ctx: NativeContext, name: string, datatype: Datatype, domainLow: number, domainHigh: number, tileExtent: number);
  name(): string;
  type(): Datatype | FilterType | ArrayType | string;
  domain(): string;
  tileExtent(): string;
  setFilterList(filterList: NativeFilterList): void;
  close(): void;
}

export declare class NativeDomain {
  constructor(ctx: NativeContext);
  addDimension(dim: NativeDimension): void;
  type(): Datatype | FilterType | ArrayType | string;
  ndim(): number;
  dimensions(): Array<Record<string, unknown>>;
  close(): void;
}

export declare class NativeAttribute {
  constructor(ctx: NativeContext, name: string, datatype: Datatype);
  name(): string;
  type(): Datatype | FilterType | ArrayType | string;
  cellValNum(): number;
  setCellValNum(num: number): void;
  setNullable(nullable: boolean): void;
  nullable(): boolean;
  setFilterList(filterList: NativeFilterList): void;
  setEnumerationName(ctx: NativeContext, name: string): void;
  close(): void;
}

export declare class NativeArraySchema {
  constructor(ctx: NativeContext, arrayType: ArrayType);
  setDomain(domain: NativeDomain): void;
  addAttribute(attr: NativeAttribute): void;
  setCellOrder(layout: Layout): void;
  setTileOrder(layout: Layout): void;
  setCapacity(capacity: number): void;
  setAllowsDups(allowsDups: boolean): void;
  check(): boolean;
  arrayType(): ArrayType;
  attributeCount(): number;
  addEnumeration(ctx: NativeContext, enmr: NativeEnumeration): void;
  addDimensionLabel(ctx: NativeContext, dimIdx: number, name: string, labelOrder: string, labelType: string): void;
  close(): void;
}

export declare class NativeArray {
  static create(uri: string, schema: NativeArraySchema): Promise<boolean>;
  static consolidate(ctx: NativeContext, uri: string, config?: NativeConfig): Promise<void>;
  static vacuum(ctx: NativeContext, uri: string, config?: NativeConfig): Promise<void>;
  constructor(ctx: NativeContext, uri: string, queryType?: QueryType);
  open(queryType: QueryType): Promise<void>;
  close(): void;
  queryType(): QueryType;
  uri(): string;
  isOpen(): boolean;
  schema(): Record<string, unknown>;
  putMetadata(key: string, datatype: Datatype, value: MetadataValue): void;
  getMetadata(key: string): MetadataValue;
  deleteMetadata(key: string): void;
  getMetadataNum(): number;
  getMetadataByIndex(index: number): { key: string, type: string, value: MetadataValue };
}


export declare class NativeSubarray {
  constructor(ctx: NativeContext, array: NativeArray);
  addRange(dimName: string, start: number, end: number): void;
  close(): void;
}

export declare class NativeQueryCondition {
  constructor(ctx: NativeContext);
  init(attribute: string, value: ArrayBufferView, op: QueryConditionOp | QueryConditionCombinationOp): void;
  combine(qc: NativeQueryCondition, op: QueryConditionOp | QueryConditionCombinationOp): NativeQueryCondition;
  negate(): NativeQueryCondition;
}

export declare class NativeQuery {
  constructor(ctx: NativeContext, array: NativeArray, queryType: QueryType);
  setLayout(layout: Layout): void;
  setSubarray(subarray: NativeSubarray): void;
  setCondition(condition: NativeQueryCondition): void;
  setDataBuffer(attribute: string, buffer: ArrayBufferView): void;
  setOffsetsBuffer(attribute: string, buffer: BigUint64Array | BigInt64Array): void;
  setValidityBuffer(attribute: string, buffer: Uint8Array): void;
  addUpdateValue(attribute: string, value: MetadataValue, datatype: Datatype): void;
  submit(): string;
  submitAsync(): Promise<string>;
  queryStatus(): QueryStatus;
  resultBufferElements(): Record<string, { first: number, second: number }>;
  applyAggregate(outputName: string, operationName: string, inputName?: string): void;
  stats(): string;
  close(): void;
}

export declare class NativeTileDBObject {
  static type(ctx: NativeContext, uri: string): string;
  static remove(ctx: NativeContext, uri: string): void;
  static move(ctx: NativeContext, oldUri: string, newUri: string): void;
  static ls(ctx: NativeContext, uri: string): { type: string, uri: string }[];
  static walk(ctx: NativeContext, uri: string, order: ObjectOrder): { type: string, uri: string }[];
}

export declare class NativeGroup {
  static create(ctx: NativeContext, uri: string): boolean;
  static consolidate(ctx: NativeContext, uri: string, config?: NativeConfig): void;
  static vacuum(ctx: NativeContext, uri: string, config?: NativeConfig): void;
  constructor(ctx: NativeContext, uri: string, queryType?: QueryType);
  open(queryType: QueryType): void;
  close(): void;
  isOpen(): boolean;
  uri(): string;
  queryType(): QueryType;
  addMember(uri: string, relative?: boolean, name?: string): void;
  removeMember(name_or_uri: string): void;
  getMemberCount(): number;
  getMemberByIndex(index: number): { uri: string, type: string, name: string | null };
  putMetadata(key: string, datatype: Datatype, value: MetadataValue): void;
  getMetadata(key: string): MetadataValue;
  deleteMetadata(key: string): void;
  getMetadataNum(): number;
  getMetadataByIndex(index: number): { key: string, type: string, value: MetadataValue };
}

export declare class NativeVFS {
  constructor(ctx: NativeContext, config?: NativeConfig);
  createBucket(uri: string): void;
  removeBucket(uri: string): void;
  isBucket(uri: string): boolean;
  emptyBucket(uri: string): void;
  isEmptyBucket(uri: string): boolean;
  createDir(uri: string): void;
  isDir(uri: string): boolean;
  removeDir(uri: string): void;
  dirSize(uri: string): number;
  isFile(uri: string): boolean;
  removeFile(uri: string): void;
  fileSize(uri: string): number;
  ls(uri: string): string[];
  moveFile(oldUri: string, newUri: string): void;
  moveDir(oldUri: string, newUri: string): void;
  copyFile(oldUri: string, newUri: string): void;
  copyDir(oldUri: string, newUri: string): void;
  touch(uri: string): void;
  open(uri: string, mode: VFSMode): void;
  read(offset: number, size: number): Buffer;
  write(buffer: Buffer): void;
  close(): void;
}

export declare class NativeFragmentInfo {
  constructor(ctx: NativeContext, uri: string);
  load(): void;
  fragmentNum(): number;
  fragmentUri(fid: number): string;
  fragmentSize(fid: number): bigint | number;
  timestampRange(fid: number): [number, number];
  mbrNum(fid: number): number;
}

export interface NativeStats {
  enable(): void;
  disable(): void;
  reset(): void;
  dumpStr(): string;
}

export interface TileDBNativeBindings {
  Context: new (config?: NativeConfig) => NativeContext;
  Config: typeof NativeConfig;
  Filter: typeof NativeFilter;
  FilterList: typeof NativeFilterList;
  Dimension: typeof NativeDimension;
  Domain: typeof NativeDomain;
  Attribute: typeof NativeAttribute;
  ArraySchema: typeof NativeArraySchema;
  Array: typeof NativeArray;
  Subarray: typeof NativeSubarray;
  QueryCondition: typeof NativeQueryCondition;
  Query: typeof NativeQuery;
  TileDBObject: typeof NativeTileDBObject;
  Group: typeof NativeGroup;
  VFS: typeof NativeVFS;
  FragmentInfo: typeof NativeFragmentInfo;
  Stats: NativeStats;
  Enumeration: {
    create(ctx: NativeContext, name: string, datatype: Datatype, values: MetadataValue[]): NativeEnumeration;
  };
  ArraySchemaEvolution: {
    new(ctx: NativeContext): NativeArraySchemaEvolution;
  };
  ConsolidationPlan: {
    new(ctx: NativeContext, array: NativeArray, fragmentSize: number): NativeConsolidationPlan;
  };
}
