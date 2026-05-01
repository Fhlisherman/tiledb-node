import type { NativeGroup, Datatype, MetadataValue, QueryType, NativeContext } from './bindings';
import { nativeData } from './native';
import { TileDBError } from './error';
import type { Context } from './context';
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

export class TileDBGroup {
  private nativeGroup: NativeGroup | null;

  public static create(ctx: Context, uri: string): boolean {
    validateTileDbUri(uri, 'create');
    return nativeData!.Group.create(ctx.native, uri);
  }

  public static consolidate(ctx: Context, uri: string, config?: Config): void {
    validateTileDbUri(uri, 'consolidate');
    nativeData!.Group.consolidate(ctx.native, uri, config?.native);
  }

  public static vacuum(ctx: Context, uri: string, config?: Config): void {
    validateTileDbUri(uri, 'vacuum');
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
