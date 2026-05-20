import type { NativeArraySchemaEvolution } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { Attribute } from './attribute';
import type { Enumeration } from './enumeration';

export class ArraySchemaEvolution {
  private nativeEvolution: NativeArraySchemaEvolution;

  constructor(ctx: Context) {
    this.nativeEvolution = new nativeData!.ArraySchemaEvolution(ctx.native);
  }

  public get native(): NativeArraySchemaEvolution {
    return this.nativeEvolution;
  }

  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  public dropAttribute(name: string): void { this.native.dropAttribute(name); }
  public addEnumeration(enmr: Enumeration): void { this.native.addEnumeration(enmr.native); }
  public dropEnumeration(name: string): void { this.native.dropEnumeration(name); }
  public extendEnumeration(enmr: Enumeration): void { this.native.extendEnumeration(enmr.native); }
  public arrayEvolve(uri: string): void { this.native.arrayEvolve(uri); }
}
