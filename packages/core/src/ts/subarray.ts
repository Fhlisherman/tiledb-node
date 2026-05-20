import type { NativeSubarray } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { TileDBArray } from './array';

export class Subarray {
  private nativeSubarray: NativeSubarray | null;

  constructor(ctx: Context, array: TileDBArray) {
    this.nativeSubarray = new nativeData!.Subarray(ctx.native, array.native);
  }

  public get native(): NativeSubarray {
    if (!this.nativeSubarray) throw new Error('Subarray closed');
    return this.nativeSubarray;
  }

  public addRange(dimName: string, start: number, end: number): void {
    this.native.addRange(dimName, start, end);
  }

  public close(): void {
    if (this.nativeSubarray) {
      this.nativeSubarray.close();
      this.nativeSubarray = null;
    }
  }
}
