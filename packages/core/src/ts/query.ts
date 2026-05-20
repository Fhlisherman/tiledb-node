import type { NativeQuery, MetadataValue, Datatype, QueryStatus, QueryType } from './bindings';
import { nativeData } from './native';
import type { Context } from './context';
import type { TileDBArray } from './array';
import type { Subarray } from './subarray';
import type { QueryCondition as QC } from './query_condition';
import type { Layout } from './types';

export class Query {
  private nativeQuery: NativeQuery | null;

  constructor(ctx: Context, array: TileDBArray, queryType: QueryType) {
    this.nativeQuery = new nativeData!.Query(ctx.native, array.native, queryType);
  }

  public get native(): NativeQuery {
    if (!this.nativeQuery) throw new Error('Query closed');
    return this.nativeQuery;
  }

  public setLayout(layout: Layout): void {
    this.native.setLayout(layout);
  }

  public setSubarray(subarray: Subarray): void {
    this.native.setSubarray(subarray.native);
  }

  public setCondition(condition: QC): void {
    this.native.setCondition(condition.native);
  }

  public setDataBuffer(attribute: string, buffer: ArrayBufferView | string[]): void {
    if (Array.isArray(buffer)) {
      const encoder = new TextEncoder();
      const encodedStrings = buffer.map(str => encoder.encode(str));
      const totalBytes = encodedStrings.reduce((acc, curr) => acc + curr.length, 0);

      const offsets = new BigUint64Array(buffer.length);
      const dataBuffer = new Uint8Array(totalBytes);

      let currentOffset = 0;
      for (let i = 0; i < encodedStrings.length; i++) {
        offsets[i] = BigInt(currentOffset);
        dataBuffer.set(encodedStrings[i], currentOffset);
        currentOffset += encodedStrings[i].length;
      }

      this.native.setOffsetsBuffer(attribute, offsets);
      this.native.setDataBuffer(attribute, dataBuffer);
    } else {
      this.native.setDataBuffer(attribute, buffer);
    }
  }

  public setOffsetsBuffer(attribute: string, buffer: BigUint64Array | BigInt64Array): void {
    this.native.setOffsetsBuffer(attribute, buffer);
  }

  public setValidityBuffer(attribute: string, buffer: Uint8Array): void {
    this.native.setValidityBuffer(attribute, buffer);
  }

  public addUpdateValue(attribute: string, value: MetadataValue, datatype: Datatype): void {
    this.native.addUpdateValue(attribute, value, datatype);
  }

  public submit(): string {
    return this.native.submit();
  }

  public async submitAsync(): Promise<string> {
    return this.native.submitAsync();
  }

  public queryStatus(): QueryStatus {
    return this.native.queryStatus() as QueryStatus;
  }

  public resultBufferElements(): Record<string, { first: number, second: number }> {
    return this.native.resultBufferElements();
  }

  public applyAggregate(outputName: string, operationName: string, inputName?: string): void {
    this.native.applyAggregate(outputName, operationName, inputName);
  }

  public getStats(): string {
    return this.native.stats();
  }

  public close(): void {
    if (this.nativeQuery) {
      this.nativeQuery.close();
      this.nativeQuery = null;
    }
  }
}
