import type { NativeArray, Datatype, MetadataValue, QueryType, NativeContext } from './bindings';
import { nativeData } from './native';
import { TileDBError } from './error';
import type { Context } from './context';
import type { ArraySchema } from './array_schema';
import type { Config } from './config';

function validateTileDbUri(uri: string, operation: string): void {
  if (!uri || typeof uri !== 'string' || uri.length === 0) {
    throw new TileDBError(`Invalid URI for ${operation}: URI must be a non-empty string`);
  }
  if (uri.includes('\0')) {
    throw new TileDBError(`Null bytes not allowed in URI for ${operation}`);
  }
  if (!uri.includes('://') && uri.includes('..')) {
    throw new TileDBError(`Path traversal not allowed in URI for ${operation}: ${uri}`);
  }
}

export class TileDBArray {
  private nativeArray: NativeArray | null;

  public static create(uri: string, schema: ArraySchema): Promise<boolean> {
    validateTileDbUri(uri, 'create');
    return nativeData!.Array.create(uri, schema.native);
  }

  public static consolidate(ctx: Context, uri: string, config?: Config): Promise<void> {
    validateTileDbUri(uri, 'consolidate');
    return nativeData!.Array.consolidate(ctx.native, uri, config?.native);
  }

  public static vacuum(ctx: Context, uri: string, config?: Config): Promise<void> {
    validateTileDbUri(uri, 'vacuum');
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
  public schema(): Record<string, unknown> { return this.native.schema(); }

  public putMetadata(key: string, datatype: Datatype, value: MetadataValue): void {
    this.native.putMetadata(key, datatype, value);
  }

  public getMetadata(key: string): MetadataValue {
    return this.native.getMetadata(key);
  }

  public deleteMetadata(key: string): void {
    this.native.deleteMetadata(key);
  }

  public getMetadataNum(): number {
    return this.native.getMetadataNum();
  }

  public getMetadataByIndex(index: number): { key: string, type: string, value: MetadataValue } {
    return this.native.getMetadataByIndex(index);
  }
}
