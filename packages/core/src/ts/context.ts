import type { NativeContext } from './bindings';
import { nativeData } from './native';
import type { Config } from './config';

export class Context {
  private nativeContext: NativeContext | null = null;

  constructor(config?: Config) {
    this.nativeContext = new nativeData!.Context(config?.native);
  }

  public get native(): NativeContext {
    if (!this.nativeContext) throw new Error('Context already closed');
    return this.nativeContext;
  }

  public getVersion(): import('./bindings').TileDBVersion {
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
