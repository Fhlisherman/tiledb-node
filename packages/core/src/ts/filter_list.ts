import type { NativeFilterList } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { Filter } from './filter';

export class FilterList {
  private nativeFilterList: NativeFilterList | null;

  constructor(ctx: Context) {
    this.nativeFilterList = new nativeData!.FilterList(ctx.native);
  }

  public get native(): NativeFilterList {
    if (!this.nativeFilterList) throw new Error('FilterList closed');
    return this.nativeFilterList;
  }

  public addFilter(filter: Filter): FilterList {
    this.native.addFilter(filter.native);
    return this;
  }

  public setChunkSize(size: number): FilterList {
    this.native.setChunkSize(size);
    return this;
  }

  public close(): void {
    if (this.nativeFilterList) {
      this.nativeFilterList.close();
      this.nativeFilterList = null;
    }
  }
}
