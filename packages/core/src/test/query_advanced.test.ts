import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Config, Context, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Query, Subarray, QueryCondition } from '../ts/index';
import * as fs from 'fs';

describe('Advanced Querying & I/O', () => {
    const ctx = new Context();
    
    // Arrays for testing
    const arrayNullableUri = 'test_array_nullable';
    const arrayVarLenUri = 'test_array_varlen';
    const arrayUpdateUri = 'test_array_update';
    const arrayMultiRangeUri = 'test_array_multirange';

    const cleanup = () => {
        [arrayNullableUri, arrayVarLenUri, arrayUpdateUri, arrayMultiRangeUri].forEach(uri => {
            if (fs.existsSync(uri)) {
                fs.rmSync(uri, { recursive: true, force: true });
            }
        });
    };

    beforeAll(cleanup);
    afterAll(cleanup);

    it('should write and read Nullable Attributes', async () => {
        // Schema
        const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 2);
        const dom = new Domain(ctx);
        dom.addDimension(dim);

        const attr = new Attribute(ctx, 'a1', 'INT32');
        attr.setNullable(true);

        const schema = new ArraySchema(ctx, 'DENSE');
        schema.setDomain(dom);
        schema.addAttribute(attr);

        expect(schema.check()).toBe(true);
        await TileDBArray.create(arrayNullableUri, schema);

        // Write
        const arrayWrite = new TileDBArray(ctx, arrayNullableUri, 'WRITE');
        const queryWrite = new Query(ctx, arrayWrite, 'WRITE');
        queryWrite.setLayout('ROW_MAJOR');

        const subWrite = new Subarray(ctx, arrayWrite);
        subWrite.addRange('d1', 1, 3);
        queryWrite.setSubarray(subWrite);

        const data = new Int32Array([10, 20, 30]);
        const validity = new Uint8Array([1, 0, 1]); // middle element is null
        
        queryWrite.setDataBuffer('a1', data);
        queryWrite.setValidityBuffer('a1', validity);
        queryWrite.submit();

        queryWrite.close();
        subWrite.close();
        arrayWrite.close();

        // Read
        const arrayRead = new TileDBArray(ctx, arrayNullableUri, 'READ');
        const queryRead = new Query(ctx, arrayRead, 'READ');
        queryRead.setLayout('ROW_MAJOR');

        const subRead = new Subarray(ctx, arrayRead);
        subRead.addRange('d1', 1, 3);
        queryRead.setSubarray(subRead);

        const readData = new Int32Array(3);
        const readValidity = new Uint8Array(3);
        
        queryRead.setDataBuffer('a1', readData);
        queryRead.setValidityBuffer('a1', readValidity);
        queryRead.submit();

        expect(Array.from(readData)).toEqual([10, 20, 30]);
        expect(Array.from(readValidity)).toEqual([1, 0, 1]);

        queryRead.close();
        subRead.close();
        arrayRead.close();
        
        schema.close();
        dim.close();
        dom.close();
        attr.close();
    });

    it('should write and read Variable-length String Attributes via auto-offsets', async () => {
        // Schema
        const dim = new Dimension(ctx, 'id', 'INT32', 1, 100, 10);
        const dom = new Domain(ctx);
        dom.addDimension(dim);

        const attr = new Attribute(ctx, 'str', 'STRING_UTF8');
        attr.setCellValNum(4294967295); // TILEDB_VAR_NUM
        
        const schema = new ArraySchema(ctx, 'SPARSE');
        schema.setDomain(dom);
        schema.addAttribute(attr);

        expect(schema.check()).toBe(true);
        await TileDBArray.create(arrayVarLenUri, schema);

        // Write
        const arrayWrite = new TileDBArray(ctx, arrayVarLenUri, 'WRITE');
        const queryWrite = new Query(ctx, arrayWrite, 'WRITE');
        queryWrite.setLayout('UNORDERED');

        const coords = new Int32Array([10, 20, 30]);
        const strings = ['hello', 'tiledb', 'world'];

        queryWrite.setDataBuffer('id', coords);
        queryWrite.setDataBuffer('str', strings); // Automagically does offset extraction
        queryWrite.submit();

        queryWrite.close();
        arrayWrite.close();

        // Read back data
        const arrayRead = new TileDBArray(ctx, arrayVarLenUri, 'READ');
        const queryRead = new Query(ctx, arrayRead, 'READ');
        queryRead.setLayout('ROW_MAJOR');

        const offsets = new BigUint64Array(3);
        const dataBuffer = new Uint8Array(16); // "hellotiledbworld" length is 16
        const readCoords = new Int32Array(3);

        queryRead.setDataBuffer('id', readCoords);
        queryRead.setDataBuffer('str', dataBuffer);
        queryRead.setOffsetsBuffer('str', offsets);
        queryRead.submit();

        const decoder = new TextDecoder();
        const decoded = decoder.decode(dataBuffer);
        expect(decoded).toBe('hellotiledbworld');
        expect(Number(offsets[0])).toBe(0);
        expect(Number(offsets[1])).toBe(5); // "hello".length
        expect(Number(offsets[2])).toBe(11); // "hello" + "tiledb"
        
        expect(Array.from(readCoords)).toEqual([10, 20, 30]);

        queryRead.close();
        arrayRead.close();
        
        schema.close();
        dim.close();
        dom.close();
        attr.close();
    });

    it('should support Subarray Multi-Range for querying disjoint subsets', async () => {
        // Prepare Sparse array
        const dim = new Dimension(ctx, 'dim1', 'INT32', 1, 100, 10);
        const dom = new Domain(ctx);
        dom.addDimension(dim);
        const attr = new Attribute(ctx, 'val', 'INT32');
        const schema = new ArraySchema(ctx, 'SPARSE');
        schema.setDomain(dom);
        schema.addAttribute(attr);
        await TileDBArray.create(arrayMultiRangeUri, schema);

        // Write points [10, 20, 30, 40, 50]
        const arrayWrite = new TileDBArray(ctx, arrayMultiRangeUri, 'WRITE');
        const queryWrite = new Query(ctx, arrayWrite, 'WRITE');
        queryWrite.setLayout('UNORDERED');
        queryWrite.setDataBuffer('dim1', new Int32Array([10, 20, 30, 40, 50]));
        queryWrite.setDataBuffer('val', new Int32Array([1, 2, 3, 4, 5]));
        queryWrite.submit();
        queryWrite.close();
        arrayWrite.close();

        // Search in ranges [10, 15] and [35, 50]
        const arrayRead = new TileDBArray(ctx, arrayMultiRangeUri, 'READ');
        const queryRead = new Query(ctx, arrayRead, 'READ');
        queryRead.setLayout('UNORDERED');
        const subarray = new Subarray(ctx, arrayRead);
        
        subarray.addRange('dim1', 10, 15);
        subarray.addRange('dim1', 35, 50); // Second range on same dim!
        queryRead.setSubarray(subarray);

        const readCoords = new Int32Array(5);
        const readVals = new Int32Array(5);
        queryRead.setDataBuffer('dim1', readCoords);
        queryRead.setDataBuffer('val', readVals);
        queryRead.submit();

        const elems = queryRead.resultBufferElements();
        // Elements loaded should be points 10, 40, 50
        expect(elems['dim1'].second).toBe(3); 
        const resultCoords = Array.from(readCoords).slice(0, 3);
        const resultVals = Array.from(readVals).slice(0, 3);
        
        // Sorting might be needed due to UNORDERED layout
        const combined = resultCoords.map((c, i) => [c, resultVals[i]]).sort((a,b) => a[0] - b[0]);
        expect(combined).toEqual([[10, 1], [40, 4], [50, 5]]);

        queryRead.close();
        subarray.close();
        arrayRead.close();
        
        schema.close();
        dim.close();
        dom.close();
        attr.close();
    });

});
