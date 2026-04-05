import { NativeContext, TileDBVersion, TileDBNativeBindings } from './bindings';

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
  private nativeContext: NativeContext | null;

  constructor() {
    this.nativeContext = new nativeData!.Context();
  }

  /**
   * Get the TileDB library version
   */
  public getVersion(): TileDBVersion {
    if (!this.nativeContext) throw new Error('Context already closed');
    return this.nativeContext.getVersion();
  }

  /**
   * Safely release native C++ memory back to the OS preempting V8 Garbage Collection
   */
  public close(): void {
    if (this.nativeContext && typeof (this.nativeContext as any).close === 'function') {
      (this.nativeContext as any).close();
      this.nativeContext = null;
    }
  }
}

export { TileDBVersion };
