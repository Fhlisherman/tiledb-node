import {
  NativeContext,
  NativeConfig,
  NativeFilter,
  NativeDimension,
  NativeDomain,
  NativeAttribute,
  NativeArraySchema,
  NativeArray,
  NativeSubarray,
  NativeQueryCondition,
  NativeQuery,
  TileDBVersion,
  TileDBNativeBindings
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

export class Context {
  // @ts-ignore
  private nativeContext: NativeContext | null;

  constructor() {
    this.nativeContext = new nativeData!.Context();
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

  public static create(uri: string, schema: ArraySchema): boolean {
    return nativeData!.Array.create(uri, schema.native);
  }

  constructor(ctx: Context, uri: string, queryType?: 'READ' | 'WRITE' | 'DELETE' | 'MODIFY_EXCLUSIVE') {
    this.nativeArray = new nativeData!.Array(ctx.native, uri, queryType);
  }

  public get native(): NativeArray {
    if (!this.nativeArray) throw new Error('Array closed');
    return this.nativeArray;
  }

  public open(queryType: 'READ' | 'WRITE' | 'DELETE' | 'MODIFY_EXCLUSIVE'): void {
    this.native.open(queryType);
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

  public setDataBuffer(attribute: string, buffer: ArrayBufferView): void {
    this.native.setDataBuffer(attribute, buffer);
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

export { TileDBVersion };
