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
    if (!this.nativeConfig) throw new Error('Config closed');
    this.nativeConfig.set(param, value);
  }

  public get(param: string): string {
    if (!this.nativeConfig) throw new Error('Config closed');
    return this.nativeConfig.get(param);
  }

  public unset(param: string): void {
    if (!this.nativeConfig) throw new Error('Config closed');
    this.nativeConfig.unset(param);
  }

  public close(): void {
    if (this.nativeConfig) {
      this.nativeConfig.close();
      this.nativeConfig = null;
    }
  }
}
