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

import { writeFileSync } from 'fs';

let nativeData: TileDBNativeBindings | undefined;

const platform = process.platform;
const arch = process.arch;

const PlatformArchMapper: Record<string, TileDBNativeBindings> = {
  "darwin-arm64": require('@tiledb-node/darwin-arm64'),
  "darwin-x64": require('@tiledb-node/darwin-x64'),
  "linux-arm64": require('@tiledb-node/linux-arm64'),
  "linux-x64": require('@tiledb-node/linux-x64'),
  "win32-x64": require('@tiledb-node/win32-x64')
}

const key = `${platform}-${arch}`;

nativeData = PlatformArchMapper[key];

if (!nativeData) {
  throw new Error(`Unsupported OS/Architecture combination: ${platform}-${arch}`);
}

/**
 * Custom error class for TileDB operations.
 * Automatically parses TileDB C API error messages to extract the component and details.
 *
 * @example
 * ```ts
 * try {
 *   await array.open('READ');
 * } catch (e) {
 *   if (e instanceof TileDBError) {
 *     console.log(e.component); // e.g. 'Array'
 *     console.log(e.details);   // e.g. 'Array does not exist'
 *   }
 * }
 * ```
 */
export class TileDBError extends Error {
  /** The TileDB subsystem that raised the error (e.g. `'Array'`, `'Query'`). */
  public component?: string;
  /** Human-readable error detail extracted from the native message. */
  public details?: string;

  /**
   * @param message - The raw error message from the TileDB C API.
   */
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


/** TileDB attribute/dimension data type. Maps to `tiledb_datatype_t`. */
export type Datatype = 'INT32' | 'INT64' | 'FLOAT32' | 'FLOAT64' | 'CHAR' | 'INT8' | 'UINT8' | 'INT16' | 'UINT16' | 'UINT32' | 'UINT64' | 'STRING_ASCII' | 'STRING_UTF8' | 'STRING_UTF16' | 'STRING_UTF32' | 'STRING_UCS2' | 'STRING_UCS4' | 'ANY' | 'DATETIME_YEAR' | 'DATETIME_MONTH' | 'DATETIME_WEEK' | 'DATETIME_DAY' | 'DATETIME_HR' | 'DATETIME_MIN' | 'DATETIME_SEC' | 'DATETIME_MS' | 'DATETIME_US' | 'DATETIME_NS' | 'DATETIME_PS' | 'DATETIME_FS' | 'DATETIME_AS' | 'TIME_HR' | 'TIME_MIN' | 'TIME_SEC' | 'TIME_MS' | 'TIME_US' | 'TIME_NS' | 'TIME_PS' | 'TIME_FS' | 'TIME_AS' | 'BLOB';
/** Compression or transformation filter type. Maps to `tiledb_filter_type_t`. */
export type FilterType = 'NONE' | 'GZIP' | 'ZSTD' | 'LZ4' | 'RLE' | 'BZIP2' | 'DOUBLE_DELTA' | 'BIT_WIDTH_REDUCTION' | 'BITSHUFFLE' | 'BYTESHUFFLE' | 'POSITIVE_DELTA';
/** Cell/tile ordering layout. Maps to `tiledb_layout_t`. */
export type Layout = 'ROW_MAJOR' | 'COL_MAJOR' | 'GLOBAL_ORDER' | 'UNORDERED';
/** TileDB array type — dense or sparse. Maps to `tiledb_array_type_t`. */
export type ArrayType = 'DENSE' | 'SPARSE';
/** Status of a submitted query. Maps to `tiledb_query_status_t`. */
export type QueryStatus = 'FAILED' | 'COMPLETED' | 'INPROGRESS' | 'INCOMPLETE' | 'UNINITIALIZED';
/** Query open mode. Maps to `tiledb_query_type_t`. */
export type QueryType = 'READ' | 'WRITE' | 'DELETE' | 'UPDATE' | 'MODIFY_EXCLUSIVE';
/** Traversal order for {@link TileDBObject.walk}. */
export type ObjectOrder = 'PREORDER' | 'POSTORDER';
/** Comparison operator for {@link QueryCondition}. */
export type QueryConditionOp = 'LT' | 'LE' | 'GT' | 'GE' | 'EQ' | 'NEQ';
/** Logical combination operator for joining {@link QueryCondition}s. */
export type QueryConditionCombinationOp = 'AND' | 'OR' | 'NOT';
/** File-handle open mode for {@link VFS}. Case-insensitive. */
export type VFSMode = 'read' | 'write' | 'append' | 'READ' | 'WRITE' | 'APPEND';


/**
 * A TileDB Context encapsulating engine state and configuration.
 *
 * Every TileDB operation requires a Context. Create one at startup and
 * share it across all objects that need the same configuration.
 *
 * @example
 * ```ts
 * const ctx = new Context();
 * console.log(ctx.getVersion()); // { major: 2, minor: 27, patch: 0 }
 * ctx.close();
 * ```
 */
export class Context {
  // @ts-ignore
  private nativeContext: NativeContext | null;

  /**
   * @param config - Optional {@link Config} to customise the TileDB engine.
   *                 When omitted, TileDB defaults are used.
   */
  constructor(config?: Config) {
    this.nativeContext = new nativeData!.Context(config?.native);
  }

  /** @internal Returns the underlying native handle. Throws if the context has been closed. */
  public get native(): NativeContext {
    if (!this.nativeContext) throw new Error('Context already closed');
    return this.nativeContext;
  }

  /**
   * Returns the linked TileDB library version.
   * @returns An object with `major`, `minor`, and `patch` fields.
   */
  public getVersion(): TileDBVersion {
    if (!this.nativeContext) throw new Error('Context already closed');
    return this.nativeContext.getVersion();
  }

  /** Releases all native resources held by this context. Safe to call multiple times. */
  public close(): void {
    if (this.nativeContext) {
      this.nativeContext.close();
      this.nativeContext = null;
    }
  }
}

/**
 * Key-value configuration for the TileDB engine.
 *
 * @example
 * ```ts
 * const cfg = new Config();
 * cfg.set('sm.tile_cache_size', '10000000');
 * const ctx = new Context(cfg);
 * ```
 */
export class Config {
  private nativeConfig: NativeConfig | null;

  constructor() {
    this.nativeConfig = new nativeData!.Config();
  }

  /** @internal */
  public get native(): NativeConfig {
    if (!this.nativeConfig) throw new Error('Config closed');
    return this.nativeConfig;
  }

  /**
   * Sets a configuration parameter.
   * @param param - Parameter name (e.g. `'sm.tile_cache_size'`).
   * @param value - Parameter value as a string.
   * @throws {Error} If the config has been closed.
   */
  public set(param: string, value: string): void {
    if (!this.nativeConfig) throw new Error('Config closed');
    this.nativeConfig.set(param, value);
  }

  /**
   * Retrieves a configuration parameter.
   * @param param - Parameter name.
   * @returns The current value of the parameter.
   */
  public get(param: string): string {
    if (!this.nativeConfig) throw new Error('Config closed');
    return this.nativeConfig.get(param);
  }

  /**
   * Resets a parameter to its TileDB default.
   * @param param - Parameter name to unset.
   */
  public unset(param: string): void {
    if (!this.nativeConfig) throw new Error('Config closed');
    this.nativeConfig.unset(param);
  }

  /** Releases native resources. Safe to call multiple times. */
  public close(): void {
    if (this.nativeConfig) {
      this.nativeConfig.close();
      this.nativeConfig = null;
    }
  }
}

/**
 * A single axis of a TileDB array's domain.
 *
 * Each dimension has a name, a datatype, a `[low, high]` domain, and a tile extent
 * that controls how data is chunked on disk.
 *
 * @example
 * ```ts
 * const dim = new Dimension(ctx, 'rows', 'INT32', 1, 100, 10);
 * console.log(dim.name()); // 'rows'
 * ```
 */
export class Dimension {
  private nativeDimension: NativeDimension | null;

  /**
   * @param ctx        - Active TileDB context.
   * @param name       - Unique name for this dimension.
   * @param datatype   - Data type of the dimension coordinates.
   * @param domainLow  - Lower bound of the dimension (inclusive).
   * @param domainHigh - Upper bound of the dimension (inclusive).
   * @param tileExtent - Tile extent (controls tiling granularity).
   */
  constructor(ctx: Context, name: string, datatype: Datatype, domainLow: number, domainHigh: number, tileExtent: number) {
    this.nativeDimension = new nativeData!.Dimension(ctx.native, name, datatype, domainLow, domainHigh, tileExtent);
  }

  /** @internal */
  public get native(): NativeDimension {
    if (!this.nativeDimension) throw new Error('Dimension closed');
    return this.nativeDimension;
  }

  /** Returns the dimension name. */
  public name(): string { return this.native.name(); }
  /** Returns the dimension data type. */
  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }
  /** Returns a string representation of `[low, high]`. */
  public domain(): string { return this.native.domain(); }
  /** Returns a string representation of the tile extent. */
  public tileExtent(): string { return this.native.tileExtent(); }

  /**
   * Attaches a filter pipeline to this dimension's coordinates.
   * @param filterList - The filter pipeline to apply.
   */
  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeDimension) {
      this.nativeDimension.close();
      this.nativeDimension = null;
    }
  }
}

/**
 * A collection of {@link Dimension}s that define the coordinate space of a TileDB array.
 *
 * @example
 * ```ts
 * const domain = new Domain(ctx);
 * domain.addDimension(new Dimension(ctx, 'x', 'INT32', 0, 99, 10));
 * domain.addDimension(new Dimension(ctx, 'y', 'INT32', 0, 99, 10));
 * schema.setDomain(domain);
 * ```
 */
export class Domain {
  private nativeDomain: NativeDomain | null;

  /** @param ctx - Active TileDB context. */
  constructor(ctx: Context) {
    this.nativeDomain = new nativeData!.Domain(ctx.native);
  }

  /** @internal */
  public get native(): NativeDomain {
    if (!this.nativeDomain) throw new Error('Domain closed');
    return this.nativeDomain;
  }

  /**
   * Adds a dimension to this domain. Dimensions are ordered by insertion.
   * @param dim - The dimension to add.
   */
  public addDimension(dim: Dimension): void {
    this.native.addDimension(dim.native);
  }

  /** Returns the data type shared by all dimensions in this domain. */
  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }
  /** Returns the number of dimensions. */
  public ndim(): number { return this.native.ndim(); }
  /** Returns an array of native dimension descriptors. */
  public dimensions(): any[] { return this.native.dimensions(); }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeDomain) {
      this.nativeDomain.close();
      this.nativeDomain = null;
    }
  }
}

/**
 * Defines a named, typed value stored in each cell of a TileDB array.
 *
 * @example
 * ```ts
 * const attr = new Attribute(ctx, 'temperature', 'FLOAT64');
 * attr.setFilterList(new FilterList(ctx).addFilter(new Filter(ctx, 'ZSTD')));
 * schema.addAttribute(attr);
 * ```
 */
export class Attribute {
  private nativeAttribute: NativeAttribute | null;

  /**
   * @param ctx      - Active TileDB context.
   * @param name     - Unique attribute name.
   * @param datatype - Data type for the attribute values.
   */
  constructor(ctx: Context, name: string, datatype: Datatype) {
    this.nativeAttribute = new nativeData!.Attribute(ctx.native, name, datatype);
  }

  /** @internal */
  public get native(): NativeAttribute {
    if (!this.nativeAttribute) throw new Error('Attribute closed');
    return this.nativeAttribute;
  }

  /** Returns the attribute name. */
  public name(): string { return this.native.name(); }
  /** Returns the attribute data type. */
  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }
  /** Returns the number of values per cell (`TILEDB_VAR_NUM` for variable-length). */
  public cellValNum(): number { return this.native.cellValNum(); }
  /**
   * Sets the number of values stored per cell.
   * Use `UINT32_MAX` (4294967295) for variable-length attributes.
   * @param num - Number of values per cell.
   */
  public setCellValNum(num: number): void { this.native.setCellValNum(num); }
  /**
   * Marks the attribute as nullable, allowing cells to store `null`.
   * @param nullable - `true` to enable nullable cells.
   */
  public setNullable(nullable: boolean): void { this.native.setNullable(nullable); }
  /** Returns whether this attribute is nullable. */
  public nullable(): boolean { return this.native.nullable(); }

  /**
   * Attaches a filter pipeline (compression, etc.) to this attribute.
   * @param filterList - The filter pipeline to apply.
   */
  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  /**
   * Binds this attribute to a named {@link Enumeration} (dictionary encoding).
   * @param ctx  - Active TileDB context.
   * @param name - Name of the enumeration previously added to the schema.
   */
  public setEnumerationName(ctx: Context, name: string): void {
    this.native.setEnumerationName(ctx.native, name);
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeAttribute) {
      this.nativeAttribute.close();
      this.nativeAttribute = null;
    }
  }
}

/**
 * Blueprint describing the structure of a TileDB array.
 *
 * Combines a {@link Domain}, one or more {@link Attribute}s, cell/tile ordering,
 * and optional enumerations and dimension labels.
 *
 * @example
 * ```ts
 * const schema = new ArraySchema(ctx, 'DENSE');
 * schema.setDomain(domain);
 * schema.addAttribute(attr);
 * schema.setCellOrder('ROW_MAJOR');
 * schema.setTileOrder('ROW_MAJOR');
 * schema.check();
 * ```
 */
export class ArraySchema {
  private nativeSchema: NativeArraySchema | null;

  /**
   * @param ctx       - Active TileDB context.
   * @param arrayType - `'DENSE'` or `'SPARSE'`.
   */
  constructor(ctx: Context, arrayType: ArrayType) {
    this.nativeSchema = new nativeData!.ArraySchema(ctx.native, arrayType);
  }

  /** @internal */
  public get native(): NativeArraySchema {
    if (!this.nativeSchema) throw new Error('ArraySchema closed');
    return this.nativeSchema;
  }

  /** Sets the array's domain (coordinate space). */
  public setDomain(domain: Domain): void { this.native.setDomain(domain.native); }
  /** Adds an attribute to the schema. */
  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  /** Sets the order in which cells are stored within a tile. */
  public setCellOrder(layout: Layout): void { this.native.setCellOrder(layout); }
  /** Sets the order in which tiles are stored on disk. */
  public setTileOrder(layout: Layout): void { this.native.setTileOrder(layout); }
  /** Sets the tile capacity for sparse arrays. */
  public setCapacity(capacity: number): void { this.native.setCapacity(capacity); }
  /** Enables or disables duplicate coordinate storage (sparse only). */
  public setAllowsDups(allows: boolean): void { this.native.setAllowsDups(allows); }
  /** Validates the schema. Returns `true` if valid; throws on error. */
  public check(): boolean { return this.native.check(); }
  /** Returns `'DENSE'` or `'SPARSE'`. */
  public arrayType(): ArrayType { return this.native.arrayType() as ArrayType; }
  /** Returns the number of attributes in this schema. */
  public attributeCount(): number { return this.native.attributeCount(); }

  /**
   * Registers an {@link Enumeration} (dictionary) with this schema.
   * @param ctx  - Active TileDB context.
   * @param enmr - The enumeration to add.
   */
  public addEnumeration(ctx: Context, enmr: Enumeration): void {
    this.native.addEnumeration(ctx.native, enmr.native);
  }

  /**
   * Adds a dimension label to the schema (experimental).
   * @param ctx        - Active TileDB context.
   * @param dimIdx     - Zero-based index of the dimension to label.
   * @param name       - Label name.
   * @param labelOrder - Ordering of label data (e.g. `'INCREASING'`).
   * @param labelType  - Data type of the label values.
   */
  public addDimensionLabel(ctx: Context, dimIdx: number, name: string, labelOrder: string, labelType: string): void {
    this.native.addDimensionLabel(ctx.native, dimIdx, name, labelOrder, labelType);
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeSchema) {
      this.nativeSchema.close();
      this.nativeSchema = null;
    }
  }
}

/**
 * The primary handle for interacting with a TileDB array on disk.
 *
 * Use the static methods to create, consolidate, or vacuum arrays.
 * Use instance methods to open, read/write metadata, and inspect the array.
 *
 * @example
 * ```ts
 * await TileDBArray.create('my_array', schema);
 * const arr = new TileDBArray(ctx, 'my_array');
 * await arr.open('WRITE');
 * arr.putMetadata('author', 'STRING_UTF8', 'Alice');
 * arr.close();
 * ```
 */
export class TileDBArray {
  private nativeArray: NativeArray | null;

  /**
   * Persists a new array to storage with the given schema.
   * @param uri    - Array URI (local path or remote).
   * @param schema - The {@link ArraySchema} defining the array structure.
   * @returns Resolves to `true` on success.
   */
  public static create(uri: string, schema: ArraySchema): Promise<boolean> {
    return nativeData!.Array.create(uri, schema.native);
  }

  /**
   * Consolidates fragments of an existing array to improve read performance.
   * @param ctx    - Active TileDB context.
   * @param uri    - Array URI.
   * @param config - Optional consolidation config overrides.
   */
  public static consolidate(ctx: Context, uri: string, config?: Config): Promise<void> {
    return nativeData!.Array.consolidate(ctx.native, uri, config?.native);
  }

  /**
   * Removes consolidated fragments that are no longer needed.
   * @param ctx    - Active TileDB context.
   * @param uri    - Array URI.
   * @param config - Optional vacuum config overrides.
   */
  public static vacuum(ctx: Context, uri: string, config?: Config): Promise<void> {
    return nativeData!.Array.vacuum(ctx.native, uri, config?.native);
  }

  /**
   * @param ctx       - Active TileDB context.
   * @param uri       - Array URI.
   * @param queryType - Optional open mode; call {@link open} explicitly if omitted.
   */
  constructor(ctx: Context, uri: string, queryType?: QueryType) {
    this.nativeArray = new nativeData!.Array(ctx.native, uri, queryType);
  }

  /** @internal */
  public get native(): NativeArray {
    if (!this.nativeArray) throw new Error('Array closed');
    return this.nativeArray;
  }

  /**
   * Opens the array for the given query type. Must be called before read/write.
   * @param queryType - `'READ'`, `'WRITE'`, `'DELETE'`, etc.
   */
  public open(queryType: QueryType): Promise<void> {
    return this.native.open(queryType);
  }

  /** Closes the array and releases native resources. Safe to call multiple times. */
  public close(): void {
    if (this.nativeArray) {
      this.nativeArray.close();
      this.nativeArray = null;
    }
  }

  /** Returns the query type the array was opened with. */
  public queryType(): QueryType { return this.native.queryType() as QueryType; }
  /** Returns the array URI. */
  public uri(): string { return this.native.uri(); }
  /** Returns `true` if the array is currently open. */
  public isOpen(): boolean { return this.nativeArray ? this.nativeArray.isOpen() : false; }
  /** Returns the array's schema descriptor. */
  public schema(): any { return this.native.schema(); }

  /**
   * Writes a metadata key-value pair. The array must be open for `'WRITE'`.
   * @param key      - Metadata key.
   * @param datatype - Data type of the value.
   * @param value    - The metadata value.
   */
  public putMetadata(key: string, datatype: Datatype, value: any): void {
    this.native.putMetadata(key, datatype, value);
  }

  /**
   * Reads a metadata value by key.
   * @param key - Metadata key.
   * @returns The metadata value, or `null` if not found.
   */
  public getMetadata(key: string): any {
    return this.native.getMetadata(key);
  }

  /**
   * Deletes a metadata entry. The array must be open for `'WRITE'`.
   * @param key - Metadata key to delete.
   */
  public deleteMetadata(key: string): void {
    this.native.deleteMetadata(key);
  }

  /** Returns the total number of metadata entries. */
  public getMetadataNum(): number {
    return this.native.getMetadataNum();
  }

  /**
   * Retrieves metadata by positional index.
   * @param index - Zero-based index.
   * @returns Object with `key`, `type`, and `value` fields.
   */
  public getMetadataByIndex(index: number): { key: string, type: string, value: any } {
    return this.native.getMetadataByIndex(index);
  }
}

/**
 * Constrains a {@link Query} to a rectangular region of the array domain.
 *
 * @example
 * ```ts
 * const sub = new Subarray(ctx, array);
 * sub.addRange('rows', 1, 10);
 * sub.addRange('cols', 5, 20);
 * query.setSubarray(sub);
 * ```
 */
export class Subarray {
  private nativeSubarray: NativeSubarray | null;

  /**
   * @param ctx   - Active TileDB context.
   * @param array - The opened {@link TileDBArray} to constrain.
   */
  constructor(ctx: Context, array: TileDBArray) {
    this.nativeSubarray = new nativeData!.Subarray(ctx.native, array.native);
  }

  /** @internal */
  public get native(): NativeSubarray {
    if (!this.nativeSubarray) throw new Error('Subarray closed');
    return this.nativeSubarray;
  }

  /**
   * Adds an inclusive range constraint on a dimension.
   * @param dimName - Name of the target dimension.
   * @param start   - Lower bound (inclusive).
   * @param end     - Upper bound (inclusive).
   */
  public addRange(dimName: string, start: number, end: number): void {
    this.native.addRange(dimName, start, end);
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeSubarray) {
      this.nativeSubarray.close();
      this.nativeSubarray = null;
    }
  }
}

/**
 * Executes read, write, delete, or update operations on a TileDB array.
 *
 * Attach data buffers, set a layout and optional subarray/condition, then
 * call {@link submit} or {@link submitAsync}.
 *
 * @example
 * ```ts
 * const query = new Query(ctx, array, 'READ');
 * query.setLayout('ROW_MAJOR');
 * const buf = new Float64Array(100);
 * query.setDataBuffer('temperature', buf);
 * query.submit();
 * ```
 */
export class Query {
  private nativeQuery: NativeQuery | null;

  /**
   * @param ctx       - Active TileDB context.
   * @param array     - An opened {@link TileDBArray}.
   * @param queryType - `'READ'`, `'WRITE'`, `'DELETE'`, or `'UPDATE'`.
   */
  constructor(ctx: Context, array: TileDBArray, queryType: QueryType) {
    this.nativeQuery = new nativeData!.Query(ctx.native, array.native, queryType);
  }

  /** @internal */
  public get native(): NativeQuery {
    if (!this.nativeQuery) throw new Error('Query closed');
    return this.nativeQuery;
  }

  /**
   * Sets the cell layout for this query.
   * @param layout - e.g. `'ROW_MAJOR'`, `'COL_MAJOR'`, `'UNORDERED'`.
   */
  public setLayout(layout: Layout): void {
    this.native.setLayout(layout);
  }

  /**
   * Restricts the query to a rectangular region.
   * @param subarray - A configured {@link Subarray}.
   */
  public setSubarray(subarray: Subarray): void {
    this.native.setSubarray(subarray.native);
  }

  /**
   * Applies a filter condition to this read query.
   * @param condition - A {@link QueryCondition} predicate.
   */
  public setCondition(condition: QueryCondition): void {
    this.native.setCondition(condition.native);
  }

  /**
   * Attaches a typed data buffer (or string array) to an attribute or dimension.
   *
   * When a `string[]` is passed the method automatically encodes to UTF-8 and
   * sets the corresponding offsets buffer.
   *
   * @param attribute - Attribute or dimension name.
   * @param buffer    - Typed array or string array.
   */
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

  /**
   * Sets the offsets buffer for a variable-length attribute.
   * @param attribute - Attribute name.
   * @param buffer    - `BigUint64Array` or `BigInt64Array` of byte offsets.
   */
  public setOffsetsBuffer(attribute: string, buffer: BigUint64Array | BigInt64Array): void {
    this.native.setOffsetsBuffer(attribute, buffer);
  }

  /**
   * Sets the validity bitmap for a nullable attribute.
   * Each byte is `1` (valid) or `0` (null).
   * @param attribute - Attribute name.
   * @param buffer    - `Uint8Array` validity bitmap.
   */
  public setValidityBuffer(attribute: string, buffer: Uint8Array): void {
    this.native.setValidityBuffer(attribute, buffer);
  }

  /**
   * Adds an update value for a `DELETE` / `UPDATE` query.
   * @param attribute - Attribute name.
   * @param value     - The new value.
   * @param datatype  - Data type of the value.
   */
  public addUpdateValue(attribute: string, value: any, datatype: Datatype): void {
    this.native.addUpdateValue(attribute, value, datatype);
  }

  /**
   * Submits the query synchronously.
   * @returns The raw query status string.
   */
  public submit(): string {
    return this.native.submit();
  }

  /**
   * Submits the query asynchronously without blocking the event loop.
   * @returns Resolves to the query status string.
   */
  public async submitAsync(): Promise<string> {
    return this.native.submitAsync();
  }

  /** Returns the current query status. */
  public queryStatus(): QueryStatus {
    return this.native.queryStatus() as QueryStatus;
  }
  
  /**
   * Returns the number of elements in each result buffer after a read query.
   * @returns Map of attribute name → `{ first: offsetElements, second: dataElements }`.
   */
  public resultBufferElements(): Record<string, { first: number, second: number }> {
    return this.native.resultBufferElements();
  }

  /**
   * Applies a built-in aggregate (e.g. `COUNT`, `SUM`, `MIN`, `MAX`) to a query.
   * @param outputName    - Name for the output buffer.
   * @param operationName - Aggregate operation (e.g. `'Count'`, `'Sum'`).
   * @param inputName     - Optional input attribute (not needed for `Count`).
   */
  public applyAggregate(outputName: string, operationName: string, inputName?: string): void {
    this.native.applyAggregate(outputName, operationName, inputName);
  }

  /** Returns a JSON string of internal query performance statistics. */
  public getStats(): string {
    return this.native.stats();
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeQuery) {
      this.nativeQuery.close();
      this.nativeQuery = null;
    }
  }
}

/**
 * A predicate used to filter read results based on attribute values.
 *
 * Conditions can be combined using logical operators (AND, OR, NOT).
 *
 * @example
 * ```ts
 * const qc = QueryCondition.create(ctx, 'temp', new Float64Array([30.0]), 'GT');
 * const qc2 = QueryCondition.create(ctx, 'city', new TextEncoder().encode('Athens'), 'EQ');
 * const combined = qc.combine(qc2, 'AND');
 * query.setCondition(combined);
 * ```
 */
export class QueryCondition {
  private nativeQC: NativeQueryCondition | null;

  /**
   * Factory method to create a query condition.
   * @param ctx       - Active TileDB context.
   * @param attribute - Attribute name to filter.
   * @param value     - Value to compare against (passed as a buffer).
   * @param op        - Comparison operator (e.g., `'LT'`, `'GT'`, `'EQ'`).
   */
  public static create(ctx: Context, attribute: string, value: ArrayBufferView, op: QueryConditionOp): QueryCondition {
    const qc = new QueryCondition(ctx);
    qc.init(attribute, value, op);
    return qc;
  }

  /**
   * @param ctx - Active TileDB context.
   */
  constructor(ctx: Context) {
    this.nativeQC = new nativeData!.QueryCondition(ctx.native);
  }

  /** @internal */
  public get native(): NativeQueryCondition {
    if (!this.nativeQC) throw new Error('QueryCondition closed');
    return this.nativeQC;
  }

  /**
   * Initializes the condition with a comparison.
   * @param attribute - Attribute name.
   * @param value     - Comparison value buffer.
   * @param op        - Comparison operator.
   */
  public init(attribute: string, value: ArrayBufferView, op: QueryConditionOp): void {
    this.native.init(attribute, value, op);
  }

  /**
   * Combines this condition with another using a logical operator.
   * @param qc - Another query condition.
   * @param op - Logical operator (`'AND'`, `'OR'`).
   * @returns A new combined {@link QueryCondition}.
   */
  public combine(qc: QueryCondition, op: QueryConditionCombinationOp): QueryCondition {
    const combinedNative = this.native.combine(qc.native, op);
    // Wrap the returned native object
    const newQc = Object.create(QueryCondition.prototype);
    newQc.nativeQC = combinedNative;
    return newQc;
  }

  /**
   * Returns a new condition that is the logical negation of this one.
   * @returns A new negated {@link QueryCondition}.
   */
  public negate(): QueryCondition {
    const negatedNative = this.native.negate();
    const newQc = Object.create(QueryCondition.prototype);
    newQc.nativeQC = negatedNative;
    return newQc;
  }
}

/**
 * Utility class for managing TileDB objects (arrays and groups).
 *
 * Provides operations like listing, moving, and deleting TileDB resources.
 */
export class TileDBObject {
  /**
   * Returns the type of the TileDB object at the given URI.
   * @param ctx - Active TileDB context.
   * @param uri - Target URI.
   * @returns `'ARRAY'`, `'GROUP'`, or `'INVALID'`.
   */
  public static type(ctx: Context, uri: string): string {
    return nativeData!.TileDBObject.type(ctx.native, uri);
  }

  /**
   * Deletes a TileDB object from storage.
   * @param ctx - Active TileDB context.
   * @param uri - URI of the object to remove.
   */
  public static remove(ctx: Context, uri: string): void {
    nativeData!.TileDBObject.remove(ctx.native, uri);
  }

  /**
   * Moves or renames a TileDB object.
   * @param ctx    - Active TileDB context.
   * @param oldUri - Source URI.
   * @param newUri - Destination URI.
   */
  public static move(ctx: Context, oldUri: string, newUri: string): void {
    nativeData!.TileDBObject.move(ctx.native, oldUri, newUri);
  }

  /**
   * Lists TileDB objects in a directory or bucket.
   * @param ctx      - Active TileDB context.
   * @param uri      - Parent URI.
   * @param callback - Optional callback invoked for each child object.
   * @returns Array of objects with `type` and `uri`.
   */
  public static ls(ctx: Context, uri: string, callback?: (type: string, uri: string) => void): { type: string, uri: string }[] {
    const results = nativeData!.TileDBObject.ls(ctx.native, uri);
    if (callback) {
      for (const res of results) {
        callback(res.type, res.uri);
      }
    }
    return results;
  }

  /**
   * Recursively crawls a URI for TileDB objects.
   * @param ctx      - Active TileDB context.
   * @param uri      - Root URI.
   * @param order    - Traversal order (`'PREORDER'` or `'POSTORDER'`).
   * @param callback - Optional callback for each discovered object.
   * @returns Array of discovered object descriptors.
   */
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
 * A container for related TileDB arrays and other groups.
 *
 * @example
 * ```ts
 * await TileDBGroup.create(ctx, 'my_project');
 * const grp = new TileDBGroup(ctx, 'my_project');
 * await grp.open('WRITE');
 * grp.addMember('my_array', true, 'data_array');
 * grp.close();
 * ```
 */
export class TileDBGroup {
  private nativeGroup: NativeGroup | null;

  /**
   * Creates a new group at the specified URI.
   * @param ctx - Active TileDB context.
   * @param uri - Group URI.
   * @returns `true` on success.
   */
  public static create(ctx: Context, uri: string): boolean {
    return nativeData!.Group.create(ctx.native, uri);
  }

  /**
   * Consolidates group metadata.
   * @param ctx    - Active TileDB context.
   * @param uri    - Group URI.
   * @param config - Optional config overrides.
   */
  public static consolidate(ctx: Context, uri: string, config?: Config): void {
    nativeData!.Group.consolidate(ctx.native, uri, config?.native);
  }

  /**
   * Vacuums group metadata after consolidation.
   * @param ctx    - Active TileDB context.
   * @param uri    - Group URI.
   * @param config - Optional config overrides.
   */
  public static vacuum(ctx: Context, uri: string, config?: Config): void {
    nativeData!.Group.vacuum(ctx.native, uri, config?.native);
  }

  /**
   * @param ctx       - Active TileDB context.
   * @param uri       - Group URI.
   * @param queryType - Optional open mode.
   */
  constructor(ctx: Context, uri: string, queryType?: QueryType) {
    this.nativeGroup = new nativeData!.Group(ctx.native, uri, queryType);
  }

  /** @internal */
  public get native(): NativeGroup {
    if (!this.nativeGroup) throw new Error('Group closed');
    return this.nativeGroup;
  }

  /**
   * Opens the group.
   * @param queryType - `'READ'` or `'WRITE'`.
   */
  public open(queryType: QueryType): void {
    this.native.open(queryType);
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeGroup) {
      this.nativeGroup.close();
      this.nativeGroup = null;
    }
  }

  /** Returns `true` if the group is open. */
  public isOpen(): boolean { return this.nativeGroup ? this.nativeGroup.isOpen() : false; }
  /** Returns the group URI. */
  public uri(): string { return this.native.uri(); }
  /** Returns the query type the group was opened with. */
  public queryType(): QueryType { return this.native.queryType() as QueryType; }

  /**
   * Adds an object as a member of this group.
   * @param uri      - URI of the member to add.
   * @param relative - Whether the URI is relative to the group URI.
   * @param name     - Optional name for the member within the group.
   */
  public addMember(uri: string, relative?: boolean, name?: string): void {
    this.native.addMember(uri, relative, name);
  }

  /**
   * Removes a member from the group.
   * @param name_or_uri - Name or URI of the member to remove.
   */
  public removeMember(name_or_uri: string): void {
    this.native.removeMember(name_or_uri);
  }

  /** Returns the number of members in the group. */
  public getMemberCount(): number {
    return this.native.getMemberCount();
  }

  /**
   * Retrieves a member by index.
   * @param index - Member index.
   * @returns Object with `uri`, `type`, and `name`.
   */
  public getMemberByIndex(index: number): { uri: string, type: string, name: string | null } {
    return this.native.getMemberByIndex(index);
  }

  /**
   * Writes group-level metadata.
   * @param key      - Metadata key.
   * @param datatype - Data type of the value.
   * @param value    - The value to store.
   */
  public putMetadata(key: string, datatype: Datatype, value: any): void {
    this.native.putMetadata(key, datatype, value);
  }

  /**
   * Reads group metadata by key.
   * @param key - Metadata key.
   */
  public getMetadata(key: string): any {
    return this.native.getMetadata(key);
  }

  /** Deletes a metadata entry from the group. */
  public deleteMetadata(key: string): void {
    this.native.deleteMetadata(key);
  }

  /** Returns total number of group metadata entries. */
  public getMetadataNum(): number {
    return this.native.getMetadataNum();
  }

  /** Retrieves metadata by index. */
  public getMetadataByIndex(index: number): { key: string, type: string, value: any } {
    return this.native.getMetadataByIndex(index);
  }
}

/**
 * An ordered list of {@link Filter}s to be applied to data during read/write.
 *
 * @example
 * ```ts
 * const list = new FilterList(ctx)
 *   .addFilter(new Filter(ctx, 'BITSHUFFLE'))
 *   .addFilter(new Filter(ctx, 'ZSTD'));
 * attr.setFilterList(list);
 * ```
 */
export class FilterList {
  private nativeFilterList: NativeFilterList | null;

  /** @param ctx - Active TileDB context. */
  constructor(ctx: Context) {
    this.nativeFilterList = new nativeData!.FilterList(ctx.native);
  }

  /** @internal */
  public get native(): NativeFilterList {
    if (!this.nativeFilterList) throw new Error('FilterList closed');
    return this.nativeFilterList;
  }

  /**
   * Appends a filter to the end of the pipeline.
   * @param filter - The filter to add.
   * @returns This {@link FilterList} for chaining.
   */
  public addFilter(filter: Filter): FilterList {
    this.native.addFilter(filter.native);
    return this;
  }

  /**
   * Sets the chunk size for filtering (sparse arrays).
   * @param size - Chunk size in bytes.
   * @returns This {@link FilterList} for chaining.
   */
  public setChunkSize(size: number): FilterList {
    this.native.setChunkSize(size);
    return this;
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeFilterList) {
      this.nativeFilterList.close();
      this.nativeFilterList = null;
    }
  }
}

/**
 * A single data transformation filter (e.g., compression, encryption).
 *
 * @example
 * ```ts
 * const zstd = new Filter(ctx, 'ZSTD');
 * zstd.setOption('COMPRESSION_LEVEL', 5);
 * ```
 */
export class Filter {
  private nativeFilter: NativeFilter | null;

  /**
   * @param ctx        - Active TileDB context.
   * @param filterType - Filter algorithm to use.
   */
  constructor(ctx: Context, filterType: FilterType) {
    this.nativeFilter = new nativeData!.Filter(ctx.native, filterType);
  }

  /** @internal */
  public get native(): NativeFilter {
    if (!this.nativeFilter) throw new Error('Filter closed');
    return this.nativeFilter;
  }

  /** Returns the filter type. */
  public type(): Datatype | FilterType | ArrayType | string { return this.native.type(); }

  /**
   * Sets a filter-specific configuration option.
   * @param option - Option name.
   * @param value  - Option value.
   * @returns This {@link Filter} for chaining.
   */
  public setOption(option: string, value: number): Filter {
    this.native.setOption(option, value);
    return this;
  }

  /** Releases native resources. */
  public close(): void {
    if (this.nativeFilter) {
      this.nativeFilter.close();
      this.nativeFilter = null;
    }
  }
}

/**
 * Virtual File System (VFS) interface.
 *
 * Provides a unified API for managing files, directories, and buckets across
 * multiple storage backends like local disk, S3, HDFS, etc.
 *
 * @example
 * ```ts
 * const vfs = new VFS(ctx);
 * if (vfs.isDir('s3://my-bucket/data')) {
 *   const files = vfs.ls('s3://my-bucket/data');
 * }
 * ```
 */
export class VFS {
  private nativeVFS: NativeVFS | null;

  /**
   * @param ctx    - Active TileDB context.
   * @param config - Optional config overrides.
   */
  constructor(ctx: Context, config?: Config) {
    this.nativeVFS = new nativeData!.VFS(ctx.native, config?.native);
  }

  /** @internal */
  public get native(): NativeVFS {
    if (!this.nativeVFS) throw new Error('VFS closed');
    return this.nativeVFS;
  }

  /** Creates a cloud storage bucket. */
  public createBucket(uri: string): void { this.native.createBucket(uri); }
  /** Deletes a cloud storage bucket. */
  public removeBucket(uri: string): void { this.native.removeBucket(uri); }
  /** Returns `true` if the URI points to a bucket. */
  public isBucket(uri: string): boolean { return this.native.isBucket(uri); }
  /** Deletes all objects in a bucket. */
  public emptyBucket(uri: string): void { this.native.emptyBucket(uri); }
  /** Returns `true` if the bucket is empty. */
  public isEmptyBucket(uri: string): boolean { return this.native.isEmptyBucket(uri); }
  
  /** Creates a directory. */
  public createDir(uri: string): void { this.native.createDir(uri); }
  /** Returns `true` if the URI is a directory. */
  public isDir(uri: string): boolean { return this.native.isDir(uri); }
  /** Deletes a directory and its contents. */
  public removeDir(uri: string): void { this.native.removeDir(uri); }
  /** Returns the recursive size of a directory in bytes. */
  public dirSize(uri: string): number { return this.native.dirSize(uri); }

  /** Returns `true` if the URI is a file. */
  public isFile(uri: string): boolean { return this.native.isFile(uri); }
  /** Deletes a file. */
  public removeFile(uri: string): void { this.native.removeFile(uri); }
  /** Returns the size of a file in bytes. */
  public fileSize(uri: string): number { return this.native.fileSize(uri); }
  
  /** Lists contents of a URI. */
  public ls(uri: string): string[] { return this.native.ls(uri); }

  /** Moves/renames a file. */
  public moveFile(oldUri: string, newUri: string): void { this.native.moveFile(oldUri, newUri); }
  /** Moves/renames a directory. */
  public moveDir(oldUri: string, newUri: string): void { this.native.moveDir(oldUri, newUri); }
  /** Copies a file. */
  public copyFile(oldUri: string, newUri: string): void { this.native.copyFile(oldUri, newUri); }
  /** Copies a directory recursively. */
  public copyDir(oldUri: string, newUri: string): void { this.native.copyDir(oldUri, newUri); }
  
  /** Creates an empty file or updates the timestamp of an existing one. */
  public touch(uri: string): void { this.native.touch(uri); }

  /**
   * Opens a file for I/O operations.
   * @param uri  - File URI.
   * @param mode - `'read'`, `'write'`, or `'append'`.
   */
  public open(uri: string, mode: VFSMode): void {
    this.native.open(uri, mode);
  }

  /**
   * Reads data from the currently open file.
   * @param offset - Start offset.
   * @param size   - Bytes to read.
   * @returns A Buffer containing the read data.
   */
  public read(offset: number, size: number): Buffer {
    return this.native.read(offset, size);
  }

  /**
   * Writes data to the currently open file.
   * @param buffer - Data to write.
   */
  public write(buffer: Buffer): void {
    this.native.write(buffer);
  }

  /** Close the currently-open file handle (not the VFS instance). */
  public closeFile(): void {
    this.native.close();
  }

  /** Destroy the VFS instance and release all native resources. */
  public close(): void {
    if (this.nativeVFS) {
      this.nativeVFS.close();
      this.nativeVFS = null;
    }
  }
}

/**
 * Inspections and metadata for the fragments comprising a TileDB array.
 *
 * @example
 * ```ts
 * const info = new FragmentInfo(ctx, 'my_array');
 * info.load();
 * console.log(info.fragmentNum());
 * ```
 */
export class FragmentInfo {
  private nativeFI: NativeFragmentInfo;

  /**
   * @param ctx - Active TileDB context.
   * @param uri - Array URI.
   */
  constructor(ctx: Context, uri: string) {
    this.nativeFI = new nativeData!.FragmentInfo(ctx.native, uri);
  }

  /** @internal */
  public get native(): NativeFragmentInfo { return this.nativeFI; }

  /** Loads fragment information from storage. */
  public load(): void { this.native.load(); }
  /** Returns the number of fragments in the array. */
  public fragmentNum(): number { return this.native.fragmentNum(); }
  /** Returns the URI of a specific fragment. */
  public fragmentUri(fid: number): string { return this.native.fragmentUri(fid); }
  /** Returns the size of a fragment in bytes. */
  public fragmentSize(fid: number): bigint | number { return this.native.fragmentSize(fid); }
  /** Returns the timestamp range `[min, max]` for a fragment. */
  public timestampRange(fid: number): [number, number] { return this.native.timestampRange(fid); }
  /** Returns the number of Minimum Bounding Rectangles in a fragment. */
  public mbrNum(fid: number): number { return this.native.mbrNum(fid); }
}

/**
 * A dictionary of string values used for dictionary-encoded attributes.
 *
 * @example
 * ```ts
 * const enmr = Enumeration.create(ctx, 'cities', 'STRING_UTF8', ['Athens', 'London', 'Paris']);
 * schema.addEnumeration(ctx, enmr);
 * attr.setEnumerationName(ctx, 'cities');
 * ```
 */
export class Enumeration {
  private nativeEnumeration: NativeEnumeration;

  /**
   * Creates a new enumeration.
   * @param ctx      - Active TileDB context.
   * @param name     - Unique name for the enumeration.
   * @param datatype - Data type of the enumeration values.
   * @param values   - Array of values to encode.
   */
  public static create(ctx: Context, name: string, datatype: Datatype, values: any[]): Enumeration {
    return new Enumeration(nativeData!.Enumeration.create(ctx.native, name, datatype, values));
  }

  private constructor(nativeEnmr: NativeEnumeration) {
    this.nativeEnumeration = nativeEnmr;
  }

  /** @internal */
  public get native(): NativeEnumeration {
    return this.nativeEnumeration;
  }

  /** Returns the enumeration name. */
  public name(): string { return this.native.name(); }
  /** Returns the underlying data type. */
  public type(): number { return this.native.type(); }
}

/**
 * API for evolving the schema of an existing TileDB array.
 *
 * Use this to add or drop attributes and enumerations without rewriting the array.
 *
 * @example
 * ```ts
 * const evolution = new ArraySchemaEvolution(ctx);
 * evolution.addAttribute(new Attribute(ctx, 'new_attr', 'INT32'));
 * evolution.arrayEvolve('my_array');
 * ```
 */
export class ArraySchemaEvolution {
  private nativeEvolution: NativeArraySchemaEvolution;

  /** @param ctx - Active TileDB context. */
  constructor(ctx: Context) {
    this.nativeEvolution = new nativeData!.ArraySchemaEvolution(ctx.native);
  }

  /** @internal */
  public get native(): NativeArraySchemaEvolution {
    return this.nativeEvolution;
  }

  /** Adds an attribute to the evolved schema. */
  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  /** Drops an attribute from the array. */
  public dropAttribute(name: string): void { this.native.dropAttribute(name); }
  /** Adds a new enumeration. */
  public addEnumeration(enmr: Enumeration): void { this.native.addEnumeration(enmr.native); }
  /** Drops an enumeration. */
  public dropEnumeration(name: string): void { this.native.dropEnumeration(name); }
  /** Extends an existing enumeration with more values. */
  public extendEnumeration(enmr: Enumeration): void { this.native.extendEnumeration(enmr.native); }
  /** Commits the schema changes to the array at the given URI. */
  public arrayEvolve(uri: string): void { this.native.arrayEvolve(uri); }
}

/**
 * Describes a plan for consolidating fragments in an array.
 *
 * @example
 * ```ts
 * const plan = new ConsolidationPlan(ctx, array, 1024 * 1024);
 * console.log(plan.numNodes());
 * ```
 */
export class ConsolidationPlan {
  private nativePlan: NativeConsolidationPlan;

  /**
   * @param ctx          - Active TileDB context.
   * @param array        - Opened {@link TileDBArray}.
   * @param fragmentSize - Target fragment size for consolidation.
   */
  constructor(ctx: Context, array: TileDBArray, fragmentSize: number) {
    this.nativePlan = new nativeData!.ConsolidationPlan(ctx.native, array.native, fragmentSize);
  }

  /** @internal */
  public get native(): NativeConsolidationPlan {
    return this.nativePlan;
  }

  /** Returns the number of consolidation nodes. */
  public numNodes(): number { return this.native.numNodes(); }
  /** Returns the number of fragments in a consolidation node. */
  public numFragments(nodeIdx: number): number { return this.native.numFragments(nodeIdx); }
  /** Returns the URI of a fragment in a consolidation node. */
  public fragmentUri(nodeIdx: number, fragIdx: number): string { return this.native.fragmentUri(nodeIdx, fragIdx); }
  /** Returns a string representation of the consolidation plan. */
  public dump(): string { return this.native.dump(); }
}

/**
 * Global TileDB performance statistics.
 *
 * Use these methods to enable, disable, and retrieve performance metrics
 * from the TileDB engine.
 */
export const Stats = {
  /** Enables performance statistics collection globally. */
  enable: () => { nativeData!.Stats.enable(); },
  /** Disables performance statistics collection. */
  disable: () => { nativeData!.Stats.disable(); },
  /** Resets all collected performance statistics. */
  reset: () => { nativeData!.Stats.reset(); },
  /** Returns a string representation of all collected statistics. */
  dumpStr: () => { return nativeData!.Stats.dumpStr(); },
  /**
   * Writes all collected statistics to a file.
   * @param filePath - Absolute or relative path to the output file.
   */
  dump: (filePath: string) => {
    const stats = nativeData!.Stats.dumpStr();
    writeFileSync(filePath, stats, 'utf-8');
  }
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
