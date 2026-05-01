import type { NativeDomain, NativeDimension } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { Dimension } from './dimension';

export class Domain {
  private nativeDomain: NativeDomain | null;

  constructor(ctx: Context) {
    this.nativeDomain = new nativeData!.Domain(ctx.native);
  }

  public get native(): NativeDomain {
    if (!this.nativeDomain) throw new Error('Domain closed');
    return this.nativeDomain;
  }

  public addDimension(dim: Dimension): void {
    this.native.addDimension(dim.native);
  }

  public type(): string { return this.native.type(); }
  public ndim(): number { return this.native.ndim(); }
  public dimensions(): any[] { return this.native.dimensions(); }

  public close(): void {
    if (this.nativeDomain) {
      this.nativeDomain.close();
      this.nativeDomain = null;
    }
  }
}
