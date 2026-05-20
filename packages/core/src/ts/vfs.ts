import type { NativeVFS, VFSMode } from './bindings';
import { nativeData } from './native';
import { TileDBError } from './error';
import type { Context } from './context';
import type { Config } from './config';

export class VFS {
  private nativeVFS: NativeVFS | null;

  private validateUri(uri: string, operation: string): void {
    if (!uri || typeof uri !== 'string' || uri.length === 0) {
      throw new TileDBError(`Invalid URI for ${operation}: URI must be a non-empty string`);
    }
    if (uri.includes('..')) {
      throw new TileDBError(`Path traversal not allowed in URI for ${operation}: ${uri}`);
    }
    if (uri.includes('\0')) {
      throw new TileDBError(`Null bytes not allowed in URI for ${operation}`);
    }
  }

  constructor(ctx: Context, config?: Config) {
    this.nativeVFS = new nativeData!.VFS(ctx.native, config?.native);
  }

  public get native(): NativeVFS {
    if (!this.nativeVFS) throw new Error('VFS closed');
    return this.nativeVFS;
  }

  public createBucket(uri: string): void { this.validateUri(uri, 'createBucket'); this.native.createBucket(uri); }
  public removeBucket(uri: string): void { this.validateUri(uri, 'removeBucket'); this.native.removeBucket(uri); }
  public isBucket(uri: string): boolean { this.validateUri(uri, 'isBucket'); return this.native.isBucket(uri); }
  public emptyBucket(uri: string): void { this.validateUri(uri, 'emptyBucket'); this.native.emptyBucket(uri); }
  public isEmptyBucket(uri: string): boolean { this.validateUri(uri, 'isEmptyBucket'); return this.native.isEmptyBucket(uri); }

  public createDir(uri: string): void { this.validateUri(uri, 'createDir'); this.native.createDir(uri); }
  public isDir(uri: string): boolean { this.validateUri(uri, 'isDir'); return this.native.isDir(uri); }
  public removeDir(uri: string): void { this.validateUri(uri, 'removeDir'); this.native.removeDir(uri); }
  public dirSize(uri: string): number { this.validateUri(uri, 'dirSize'); return this.native.dirSize(uri); }

  public isFile(uri: string): boolean { this.validateUri(uri, 'isFile'); return this.native.isFile(uri); }
  public removeFile(uri: string): void { this.validateUri(uri, 'removeFile'); this.native.removeFile(uri); }
  public fileSize(uri: string): number { this.validateUri(uri, 'fileSize'); return this.native.fileSize(uri); }

  public ls(uri: string): string[] { this.validateUri(uri, 'ls'); return this.native.ls(uri); }

  public moveFile(oldUri: string, newUri: string): void { this.validateUri(oldUri, 'moveFile'); this.validateUri(newUri, 'moveFile'); this.native.moveFile(oldUri, newUri); }
  public moveDir(oldUri: string, newUri: string): void { this.validateUri(oldUri, 'moveDir'); this.validateUri(newUri, 'moveDir'); this.native.moveDir(oldUri, newUri); }
  public copyFile(oldUri: string, newUri: string): void { this.validateUri(oldUri, 'copyFile'); this.validateUri(newUri, 'copyFile'); this.native.copyFile(oldUri, newUri); }
  public copyDir(oldUri: string, newUri: string): void { this.validateUri(oldUri, 'copyDir'); this.validateUri(newUri, 'copyDir'); this.native.copyDir(oldUri, newUri); }

  public touch(uri: string): void { this.validateUri(uri, 'touch'); this.native.touch(uri); }

  public open(uri: string, mode: VFSMode): void {
    this.validateUri(uri, 'open');
    this.native.open(uri, mode);
  }

  public read(offset: number, size: number): Buffer {
    return this.native.read(offset, size);
  }

  public write(buffer: Buffer): void {
    this.native.write(buffer);
  }

  public closeFile(): void {
    this.native.close();
  }

  public close(): void {
    if (this.nativeVFS) {
      this.nativeVFS.close();
      this.nativeVFS = null;
    }
  }
}
