import type { NativeAttribute, Datatype } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { FilterList } from './filter_list';

export class Attribute {
  private nativeAttribute: NativeAttribute | null;

  constructor(ctx: Context, name: string, datatype: Datatype) {
    this.nativeAttribute = new nativeData!.Attribute(ctx.native, name, datatype);
  }

  public get native(): NativeAttribute {
    if (!this.nativeAttribute) throw new Error('Attribute closed');
    return this.nativeAttribute;
  }

  public name(): string { return this.native.name(); }
  public type(): string { return this.native.type(); }
  public cellValNum(): number { return this.native.cellValNum(); }
  public setCellValNum(num: number): void { this.native.setCellValNum(num); }
  public setNullable(nullable: boolean): void { this.native.setNullable(nullable); }
  public nullable(): boolean { return this.native.nullable(); }

  public setFilterList(filterList: FilterList): void {
    this.native.setFilterList(filterList.native);
  }

  public setEnumerationName(ctx: Context, name: string): void {
    this.native.setEnumerationName(ctx.native, name);
  }

  public close(): void {
    if (this.nativeAttribute) {
      this.nativeAttribute.close();
      this.nativeAttribute = null;
    }
  }
}
