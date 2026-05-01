import type { NativeFragmentInfo, NativeContext } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';

export class FragmentInfo {
  private nativeFI: NativeFragmentInfo;

  constructor(ctx: Context, uri: string) {
    this.nativeFI = new nativeData!.FragmentInfo(ctx.native, uri);
  }

  public get native(): NativeFragmentInfo { return this.nativeFI; }

  public load(): void { this.native.load(); }
  public fragmentNum(): number { return this.native.fragmentNum(); }
  public fragmentUri(fid: number): string { return this.native.fragmentUri(fid); }
  public fragmentSize(fid: number): bigint | number { return this.native.fragmentSize(fid); }
  public timestampRange(fid: number): [number, number] { return this.native.timestampRange(fid); }
  public mbrNum(fid: number): number { return this.native.mbrNum(fid); }
}
