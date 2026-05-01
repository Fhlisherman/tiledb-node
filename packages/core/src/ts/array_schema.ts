import type { NativeArraySchema, NativeDomain, NativeAttribute, NativeArray, ArrayType, NativeContext } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { Domain } from './domain';
import type { Attribute } from './attribute';
import type { Layout } from './types';
import type { Enumeration } from './enumeration';

export class ArraySchema {
  private nativeSchema: NativeArraySchema | null;

  constructor(ctx: Context, arrayType: ArrayType) {
    this.nativeSchema = new nativeData!.ArraySchema(ctx.native, arrayType);
  }

  public get native(): NativeArraySchema {
    if (!this.nativeSchema) throw new Error('ArraySchema closed');
    return this.nativeSchema;
  }

  public setDomain(domain: Domain): void { this.native.setDomain(domain.native); }
  public addAttribute(attr: Attribute): void { this.native.addAttribute(attr.native); }
  public setCellOrder(layout: Layout): void { this.native.setCellOrder(layout); }
  public setTileOrder(layout: Layout): void { this.native.setTileOrder(layout); }
  public setCapacity(capacity: number): void { this.native.setCapacity(capacity); }
  public setAllowsDups(allows: boolean): void { this.native.setAllowsDups(allows); }
  public check(): boolean { return this.native.check(); }
  public arrayType(): ArrayType { return this.native.arrayType() as ArrayType; }
  public attributeCount(): number { return this.native.attributeCount(); }

  public addEnumeration(ctx: Context, enmr: Enumeration): void {
    this.native.addEnumeration(ctx.native, enmr.native);
  }

  public addDimensionLabel(ctx: Context, dimIdx: number, name: string, labelOrder: string, labelType: string): void {
    this.native.addDimensionLabel(ctx.native, dimIdx, name, labelOrder, labelType);
  }

  public close(): void {
    if (this.nativeSchema) {
      this.nativeSchema.close();
      this.nativeSchema = null;
    }
  }
}
