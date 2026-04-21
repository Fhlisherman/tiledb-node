export interface TileDBVersion {
  major: number;
  minor: number;
  patch: number;
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
  constructor(ctx: NativeContext, filterType: string);
  type(): string;
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
  constructor(ctx: NativeContext, name: string, datatype: string, domainLow: number, domainHigh: number, tileExtent: number);
  name(): string;
  type(): string;
  domain(): string;
  tileExtent(): string;
  setFilterList(filterList: NativeFilterList): void;
  close(): void;
}

export declare class NativeDomain {
  constructor(ctx: NativeContext);
  addDimension(dim: NativeDimension): void;
  type(): string;
  ndim(): number;
  dimensions(): any[];
  close(): void;
}

export declare class NativeAttribute {
  constructor(ctx: NativeContext, name: string, datatype: string);
  name(): string;
  type(): string;
  cellValNum(): number;
  setCellValNum(num: number): void;
  setNullable(nullable: boolean): void;
  nullable(): boolean;
  setFilterList(filterList: NativeFilterList): void;
  close(): void;
}

export declare class NativeArraySchema {
  constructor(ctx: NativeContext, arrayType: string);
  setDomain(domain: NativeDomain): void;
  addAttribute(attr: NativeAttribute): void;
  setCellOrder(layout: string): void;
  setTileOrder(layout: string): void;
  setCapacity(capacity: number): void;
  setAllowsDups(allowsDups: boolean): void;
  check(): boolean;
  arrayType(): string;
  attributeCount(): number;
  close(): void;
}

export declare class NativeArray {
  static create(uri: string, schema: NativeArraySchema): Promise<boolean>;
  static consolidate(ctx: NativeContext, uri: string, config?: NativeConfig): Promise<void>;
  static vacuum(ctx: NativeContext, uri: string, config?: NativeConfig): Promise<void>;
  constructor(ctx: NativeContext, uri: string, queryType?: string);
  open(queryType: string): Promise<void>;
  close(): void;
  queryType(): string;
  uri(): string;
  isOpen(): boolean;
  schema(): any;
  putMetadata(key: string, datatype: string, value: any): void;
  getMetadata(key: string): any;
  deleteMetadata(key: string): void;
  getMetadataNum(): number;
  getMetadataByIndex(index: number): { key: string, type: string, value: any };
}


export declare class NativeSubarray {
  constructor(ctx: NativeContext, array: NativeArray);
  addRange(dimName: string, start: number, end: number): void;
  close(): void;
}

export declare class NativeQueryCondition {
  constructor(ctx: NativeContext);
  init(attribute: string, value: ArrayBufferView, op: string): void;
  combine(qc: NativeQueryCondition, op: string): NativeQueryCondition;
  negate(): NativeQueryCondition;
}

export declare class NativeQuery {
  constructor(ctx: NativeContext, array: NativeArray, queryType: string);
  setLayout(layout: string): void;
  setSubarray(subarray: NativeSubarray): void;
  setCondition(condition: NativeQueryCondition): void;
  setDataBuffer(attribute: string, buffer: ArrayBufferView): void;
  setOffsetsBuffer(attribute: string, buffer: BigUint64Array | BigInt64Array): void;
  setValidityBuffer(attribute: string, buffer: Uint8Array): void;
  addUpdateValue(attribute: string, value: any, datatype: string): void;
  submit(): string;
  submitAsync(): Promise<string>;
  queryStatus(): string;
  resultBufferElements(): Record<string, { first: number, second: number }>;
  close(): void;
}

export declare class NativeTileDBObject {
  static type(ctx: NativeContext, uri: string): string;
  static remove(ctx: NativeContext, uri: string): void;
  static move(ctx: NativeContext, oldUri: string, newUri: string): void;
  static ls(ctx: NativeContext, uri: string): { type: string, uri: string }[];
  static walk(ctx: NativeContext, uri: string, order: string): { type: string, uri: string }[];
}

export declare class NativeGroup {
  static create(ctx: NativeContext, uri: string): boolean;
  static consolidate(ctx: NativeContext, uri: string, config?: NativeConfig): void;
  static vacuum(ctx: NativeContext, uri: string, config?: NativeConfig): void;
  constructor(ctx: NativeContext, uri: string, queryType?: string);
  open(queryType: string): void;
  close(): void;
  isOpen(): boolean;
  uri(): string;
  queryType(): string;
  addMember(uri: string, relative?: boolean, name?: string): void;
  removeMember(name_or_uri: string): void;
  getMemberCount(): number;
  getMemberByIndex(index: number): { uri: string, type: string, name: string | null };
  putMetadata(key: string, datatype: string, value: any): void;
  getMetadata(key: string): any;
  deleteMetadata(key: string): void;
  getMetadataNum(): number;
  getMetadataByIndex(index: number): { key: string, type: string, value: any };
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
  open(uri: string, mode: string): void;
  read(offset: number, size: number): Buffer;
  write(buffer: Buffer): void;
  close(): void;
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
}
