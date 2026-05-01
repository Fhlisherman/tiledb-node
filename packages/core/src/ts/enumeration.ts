import type { NativeEnumeration, Datatype, MetadataValue, NativeContext } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';

export class Enumeration {
  private nativeEnumeration: NativeEnumeration;

  public static create(ctx: Context, name: string, datatype: Datatype, values: MetadataValue[]): Enumeration {
    return new Enumeration(nativeData!.Enumeration.create(ctx.native, name, datatype, values));
  }

  private constructor(nativeEnmr: NativeEnumeration) {
    this.nativeEnumeration = nativeEnmr;
  }

  public get native(): NativeEnumeration {
    return this.nativeEnumeration;
  }

  public name(): string { return this.native.name(); }
  public type(): number { return this.native.type(); }
}
