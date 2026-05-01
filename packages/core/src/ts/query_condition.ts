import type { NativeQueryCondition, NativeContext, QueryConditionOp, QueryConditionCombinationOp } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';

export class QueryCondition {
  private nativeQC: NativeQueryCondition | null;

  public static create(ctx: Context, attribute: string, value: ArrayBufferView, op: QueryConditionOp): QueryCondition {
    const qc = new QueryCondition(ctx);
    qc.init(attribute, value, op);
    return qc;
  }

  constructor(ctx: Context) {
    this.nativeQC = new nativeData!.QueryCondition(ctx.native);
  }

  public get native(): NativeQueryCondition {
    if (!this.nativeQC) throw new Error('QueryCondition closed');
    return this.nativeQC;
  }

  public init(attribute: string, value: ArrayBufferView, op: QueryConditionOp): void {
    this.native.init(attribute, value, op);
  }

  public combine(qc: QueryCondition, op: QueryConditionCombinationOp): QueryCondition {
    const combinedNative = this.native.combine(qc.native, op);
    const newQc = Object.create(QueryCondition.prototype);
    newQc.nativeQC = combinedNative;
    return newQc;
  }

  public negate(): QueryCondition {
    const negatedNative = this.native.negate();
    const newQc = Object.create(QueryCondition.prototype);
    newQc.nativeQC = negatedNative;
    return newQc;
  }
}
