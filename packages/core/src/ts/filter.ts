import type { NativeFilter, FilterType } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';

export class Filter {
  private nativeFilter: NativeFilter | null;

  constructor(ctx: Context, filterType: FilterType) {
    this.nativeFilter = new nativeData!.Filter(ctx.native, filterType);
  }

  public get native(): NativeFilter {
    if (!this.nativeFilter) throw new Error('Filter closed');
    return this.nativeFilter;
  }

  public type(): string { return this.native.type(); }

  public setOption(option: string, value: number): Filter {
    this.native.setOption(option, value);
    return this;
  }

  public close(): void {
    if (this.nativeFilter) {
      this.nativeFilter.close();
      this.nativeFilter = null;
    }
  }
}
