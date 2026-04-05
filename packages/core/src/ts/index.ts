import {
  NativeContext,
  NativeConfig,
  NativeFilter,
  NativeDimension,
  NativeDomain,
  NativeAttribute,
  NativeArraySchema,
  NativeArray,
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

  public static create(ctx: Context, uri: string, schema: ArraySchema): boolean {
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

export { TileDBVersion };
