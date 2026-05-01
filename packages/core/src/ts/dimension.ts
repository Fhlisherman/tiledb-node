import type { NativeDimension, NativeFilterList, Datatype } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { FilterList } from './filter_list';

export class Dimension {
  private nativeDimension: NativeDimension | null;

  constructor(ctx: Context, name: string, datatype: Datatype, domainLow: number, domainHigh: number, tileExtent: number) {
    this.nativeDimension = new nativeData!.Dimension(ctx.native, name, datatype, domainLow, domainHigh, tileExtent);
  }

  public get native(): NativeDimension {
    if (!this.nativeDimension) throw new Error('Dimension closed');
    return this.nativeDimension;
  }

  public name(): string { return this.native.name(); }
  public type(): string { return this.native.type(); }
  public domain(): string { return this.native.domain(); }
  public tileExtent(): string { return this.native.tileExtent(); }

  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  public close(): void {
    if (this.nativeDimension) {
      this.nativeDimension.close();
      this.nativeDimension = null;
    }
  }
}
