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

export interface TileDBNativeBindings {
  Context: typeof NativeContext;
}
