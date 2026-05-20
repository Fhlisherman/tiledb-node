import type { NativeConfig } from './bindings';
import { nativeData } from './native';

export class Config {
  private nativeConfig: NativeConfig | null;

  constructor() {
    this.nativeConfig = new nativeData!.Config();
  }

  public get native(): NativeConfig {
    if (!this.nativeConfig) throw new Error('Config closed');
    return this.nativeConfig;
  }

  public set(param: string, value: string): void {
    this.native.set(param, value);
  }

  public get(param: string): string {
    return this.native.get(param);
  }

  public unset(param: string): void {
    this.native.unset(param);
  }

  public close(): void {
    if (this.nativeConfig) {
      this.nativeConfig.close();
      this.nativeConfig = null;
    }
  }
}
