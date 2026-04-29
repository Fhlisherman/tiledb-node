import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Context, Filter, FilterList, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Query, Subarray, FilterType } from '../ts/index';
import * as fs from 'fs';

describe('Data Filtering (FilterList)', () => {
    const ctx = new Context();
    const arrayUri = 'test_array_filter';

    beforeAll(() => {
        if (fs.existsSync(arrayUri)) {
            fs.rmSync(arrayUri, { recursive: true, force: true });
        }
    });

    afterAll(() => {
        if (fs.existsSync(arrayUri)) {
            fs.rmSync(arrayUri, { recursive: true, force: true });
        }
    });

    it('should create a Filter with a specific type', () => {
        const filter = new Filter(ctx, 'GZIP');
        expect(filter.type()).toBe('GZIP');
        filter.close();
    });

    it('should create filters for various compression types', () => {
        const types: FilterType[] = ['ZSTD', 'LZ4', 'BZIP2', 'RLE', 'DOUBLE_DELTA', 'NONE'];
        for (const t of types) {
            const filter = new Filter(ctx, t);
            expect(filter.type()).toBe(t);
            filter.close();
        }
    });

    it('should set filter options like compression level', () => {
        const filter = new Filter(ctx, 'GZIP');
        // Should not throw
        filter.setOption('COMPRESSION_LEVEL', 5);
        filter.close();
    });

    it('should create a FilterList and add filters', () => {
        const fl = new FilterList(ctx);
        const gzip = new Filter(ctx, 'GZIP');
        gzip.setOption('COMPRESSION_LEVEL', 9);
        fl.addFilter(gzip);
        fl.close();
        gzip.close();
    });

    it('should set chunk size on FilterList', () => {
        const fl = new FilterList(ctx);
        // Should not throw
        fl.setChunkSize(65536);
        fl.close();
    });

    it('should support chaining on FilterList', () => {
        const fl = new FilterList(ctx);
        const gzip = new Filter(ctx, 'GZIP');
        const result = fl.addFilter(gzip).setChunkSize(4096);
        // Chaining should return the FilterList
        expect(result).toBe(fl);
        fl.close();
        gzip.close();
    });

    it('should wire FilterList to Attribute.setFilterList', () => {
        const fl = new FilterList(ctx);
        const zstd = new Filter(ctx, 'ZSTD');
        zstd.setOption('COMPRESSION_LEVEL', 3);
        fl.addFilter(zstd);

        const attr = new Attribute(ctx, 'a1', 'INT32');
        // Should not throw
        attr.setFilterList(fl);

        attr.close();
        fl.close();
        zstd.close();
    });

    it('should wire FilterList to Dimension.setFilterList', () => {
        const fl = new FilterList(ctx);
        const lz4 = new Filter(ctx, 'LZ4');
        fl.addFilter(lz4);

        const dim = new Dimension(ctx, 'd1', 'INT32', 1, 100, 10);
        // Should not throw
        dim.setFilterList(fl);

        dim.close();
        fl.close();
        lz4.close();
    });

    it('should create an array with filters and perform I/O', async () => {
        // Set up filters
        const attrFilter = new FilterList(ctx);
        const gzip = new Filter(ctx, 'GZIP');
        gzip.setOption('COMPRESSION_LEVEL', 7);
        attrFilter.addFilter(gzip);

        const dimFilter = new FilterList(ctx);
        const zstd = new Filter(ctx, 'ZSTD');
        dimFilter.addFilter(zstd);

        // Create schema with filters
        const dim = new Dimension(ctx, 'd1', 'INT32', 1, 10, 5);
        dim.setFilterList(dimFilter);

        const dom = new Domain(ctx);
        dom.addDimension(dim);

        const attr = new Attribute(ctx, 'a1', 'INT32');
        attr.setFilterList(attrFilter);

        const schema = new ArraySchema(ctx, 'DENSE');
        schema.setDomain(dom);
        schema.addAttribute(attr);
        expect(schema.check()).toBe(true);

        // Create array
        await TileDBArray.create(arrayUri, schema);

        // Write data
        const arrayWrite = new TileDBArray(ctx, arrayUri, 'WRITE');
        const queryWrite = new Query(ctx, arrayWrite, 'WRITE');
        queryWrite.setLayout('ROW_MAJOR');

        const subarrayWrite = new Subarray(ctx, arrayWrite);
        subarrayWrite.addRange('d1', 1, 5);
        queryWrite.setSubarray(subarrayWrite);

        const writeData = new Int32Array([100, 200, 300, 400, 500]);
        queryWrite.setDataBuffer('a1', writeData);
        const writeStatus = queryWrite.submit();
        expect(writeStatus).toBe('COMPLETE');

        queryWrite.close();
        subarrayWrite.close();
        arrayWrite.close();

        // Read data back — the filters compress/decompress transparently
        const arrayRead = new TileDBArray(ctx, arrayUri, 'READ');
        const queryRead = new Query(ctx, arrayRead, 'READ');
        queryRead.setLayout('ROW_MAJOR');

        const subarrayRead = new Subarray(ctx, arrayRead);
        subarrayRead.addRange('d1', 1, 5);
        queryRead.setSubarray(subarrayRead);

        const readData = new Int32Array(5);
        queryRead.setDataBuffer('a1', readData);
        const readStatus = queryRead.submit();
        expect(readStatus).toBe('COMPLETE');
        expect(Array.from(readData)).toEqual([100, 200, 300, 400, 500]);

        queryRead.close();
        subarrayRead.close();
        arrayRead.close();

        // Cleanup
        schema.close();
        attr.close();
        dom.close();
        dim.close();
        attrFilter.close();
        dimFilter.close();
        gzip.close();
        zstd.close();
    });
});
