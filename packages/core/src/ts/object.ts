import type { ObjectOrder } from './bindings';
import { nativeData } from './native';
import { validateTileDbUri } from './validation';
import type { Context } from './context';


export class TileDBObject {
  public static type(ctx: Context, uri: string): string {
    validateTileDbUri(uri, 'type');
    return nativeData!.TileDBObject.type(ctx.native, uri);
  }

  public static remove(ctx: Context, uri: string): void {
    validateTileDbUri(uri, 'remove');
    nativeData!.TileDBObject.remove(ctx.native, uri);
  }

  public static move(ctx: Context, oldUri: string, newUri: string): void {
    validateTileDbUri(oldUri, 'move');
    validateTileDbUri(newUri, 'move');
    nativeData!.TileDBObject.move(ctx.native, oldUri, newUri);
  }

  public static ls(ctx: Context, uri: string, callback?: (type: string, uri: string) => void): { type: string, uri: string }[] {
    validateTileDbUri(uri, 'ls');
    const results = nativeData!.TileDBObject.ls(ctx.native, uri);
    if (callback) {
      for (const res of results) {
        callback(res.type, res.uri);
      }
    }
    return results;
  }

  public static walk(ctx: Context, uri: string, order: ObjectOrder, callback?: (type: string, uri: string) => void): { type: string, uri: string }[] {
    validateTileDbUri(uri, 'walk');
    const results = nativeData!.TileDBObject.walk(ctx.native, uri, order);
    if (callback) {
      for (const res of results) {
        callback(res.type, res.uri);
      }
    }
    return results;
  }
}
