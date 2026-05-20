import { TileDBError } from './error';

export function validateTileDbUri(uri: string, operation: string): void {
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
