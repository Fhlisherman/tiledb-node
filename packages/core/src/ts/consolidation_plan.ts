import type { NativeConsolidationPlan, NativeArray } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { TileDBArray } from './array';

export class ConsolidationPlan {
  private nativePlan: NativeConsolidationPlan;

  constructor(ctx: Context, array: TileDBArray, fragmentSize: number) {
    this.nativePlan = new nativeData!.ConsolidationPlan(ctx.native, array.native, fragmentSize);
  }

  public get native(): NativeConsolidationPlan {
    return this.nativePlan;
  }

  public numNodes(): number { return this.native.numNodes(); }
  public numFragments(nodeIdx: number): number { return this.native.numFragments(nodeIdx); }
  public fragmentUri(nodeIdx: number, fragIdx: number): string { return this.native.fragmentUri(nodeIdx, fragIdx); }
  public dump(): string { return this.native.dump(); }
}
