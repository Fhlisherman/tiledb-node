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

export declare class NativeDimension {
  constructor(ctx: NativeContext, name: string, datatype: string, domainLow: number, domainHigh: number, tileExtent: number);
  name(): string;
  type(): string;
  domain(): string;
  tileExtent(): string;
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
  setFilterList(filterList: any): void;
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
  static create(uri: string, schema: NativeArraySchema): boolean;
  constructor(ctx: NativeContext, uri: string, queryType?: string);
  open(queryType: string): void;
  close(): void;
  queryType(): string;
  uri(): string;
  isOpen(): boolean;
  schema(): any;
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
  submit(): string;
  submitAsync(): Promise<string>;
  queryStatus(): string;
  resultBufferElements(): Record<string, { first: number, second: number }>;
  close(): void;
}

export interface TileDBNativeBindings {
  Context: typeof NativeContext;
  Config: typeof NativeConfig;
  Filter: typeof NativeFilter;
  Dimension: typeof NativeDimension;
  Domain: typeof NativeDomain;
  Attribute: typeof NativeAttribute;
  ArraySchema: typeof NativeArraySchema;
  Array: typeof NativeArray;
  Subarray: typeof NativeSubarray;
  QueryCondition: typeof NativeQueryCondition;
  Query: typeof NativeQuery;
}
