# TileDB Node.js Project Roadmap

This document outlines the remaining work required to achieve 100% parity with the TileDB C API and provide a first-class, type-safe developer experience in Node.js.

## Status Legend
- 🟢 **Complete**: Ready for use.
- 🟡 **Partial**: Basic implementation exists; needs advanced features.
- 🔴 **Missing**: Implementation not yet started or not yet working.

---

## 1. Core Lifecycle & Metadata
Infrastructure for organizing data and managing resources.

- [x] **Context** 🟢: Implementation of `tiledb_ctx_t` with configuration support.
- [x] **Config** 🟢: Comprehensive support for `tiledb_config_t` (set, get, unset).
- [x] **Group Management** 🟢:
    - `Group.create(uri)`
    - `Group.open(queryType)`
    - `Group.addMember(uri, relative?)`
    - `Group.removeMember(name)`
    - `Group.getMemberCount()`
    - `Group.getMemberByIndex(idx)`
- [x] **Metadata Support** 🟢:
    - `Array.putMetadata(key, value)`
    - `Array.getMetadata(key)`
    - `Array.deleteMetadata(key)`
    - (Same for `Group` metadata)
- [x] **Object API** 🟢:
    - `TileDBObject.ls(path, callback)`
    - `TileDBObject.walk(path, order, callback)`
    - `TileDBObject.move(oldPath, newPath)`
    - `TileDBObject.remove(path)`
- [x] **Array & Group Maintenance** 🟢:
    - `Array.consolidate(ctx, uri, config?)`
    - `Array.vacuum(ctx, uri, config?)`
    - `Group.consolidate(ctx, uri, config?)`
    - `Group.vacuum(ctx, uri, config?)`

## 2. Virtual File System (VFS)
Enabling direct interaction with cloud storage and local filesystems.

- [x] **VFS Core** 🟢:
    - `VFS.createBucket(uri)`
    - `VFS.removeBucket(uri)`
    - `VFS.ls(uri)`
    - `VFS.isDir(uri)` / `VFS.isFile(uri)`
    - `VFS.removeDir(uri)` / `VFS.removeFile(uri)`
- [x] **File Handles** 🟢:
    - `VFS.open(uri, mode)`
    - `VFS.read(offset, size)` -> `Buffer`
    - `VFS.write(buffer)`
    - `VFS.close()`
- [x] **Copy/Move** 🟢:
    - `VFS.copyFile(oldPath, newPath)`
    - `VFS.copyDir(oldPath, newPath)`
    - `VFS.moveFile(oldPath, newPath)`
    - `VFS.moveDir(oldPath, newPath)`

## 3. Advanced Querying & I/O
Deep integration with TileDB's core engine for complex data patterns.

- [x] **Standard Query** 🟢: Basic read/write with fixed-size attributes.
- [x] **QueryCondition** 🟢: Engine-side filtering (`init`, `combine`, `negate`).
- [x] **Async Submission** 🟢: `Query.submitAsync()` using `Napi::AsyncWorker`.
- [x] **Data Filtering (FilterList)** 🟢:
    - `FilterList.create(ctx)`
    - `FilterList.addFilter(filter)`
    - `FilterList.setChunkSize(size)`
    - Wired to `Attribute.setFilterList` and `Dimension.setFilterList`.
- [x] **Variable-length Attributes** 🟢:
    - Support for `TILEDB_VAR_NUM` and offset buffers in `Query`.
    - Automatic offset calculation in `index.ts`.
- [x] **Nullable Attributes** 🟢:
    - Full integration of validity buffers in `Query.setDataBuffer`.
- [x] **Update/Delete Queries** 🟢:
    - Support for `UPDATE` / `DELETE` query types.
    - `Query.addUpdateValue(attribute, value)`.
- [x] **Subarray Multi-Range** 🟢:
    - Extend `Subarray.addRange` to support multiple ranges per dimension.

## 4. Advanced Inspection & Stats
Helping developers understand their data and performance.

- [x] **Fragment Info** 🟢:
    - `FragmentInfo.load(uri)`
    - Get fragment count, URIs, and sizes.
    - Get non-empty overlap and MBRs for each fragment.
- [x] **Performance Stats** 🟢:
    - `Stats.enable()` / `Stats.disable()`
    - `Stats.dump(file)` / `Stats.dumpStr()`
    - `Query.getStats()` support.

## 5. Experimental Power Features
TileDB experimental features which are now standard in most use cases.

- [x] **Query Aggregates** 🟢:
    - `QueryChannel` support.
    - `Aggregates.SUM()`, `Aggregates.COUNT()`, `Aggregates.MEAN()`, etc.
- [x] **Schema Evolution** 🟢:
    - `ArraySchemaEvolution.addAttribute()`
    - `ArraySchemaEvolution.dropAttribute()`
    - `Array.evolve(schemaEvolution)`
- [x] **Enumerations (Dictionaries)** 🟢:
    - `Enumeration.create(name, datatype, values)`.
    - Binding enums to Attribute schemas.
- [x] **Consolidation Plans** 🟢:
    - `ConsolidationPlan.create(fragmentSize)`.
- [x] **Dimension Labels** 🟢:
    - `ArraySchema.addDimensionLabel(ctx, name, dimIdx, order, type)`.
    - Querying labeled dimensions.

## 6. Type Safety & DX (Developer Experience)
Making the library robust and easy to use in modern TypeScript projects.

- [x] **Basic Typed Bindings** 🟢: `bindings.d.ts` matches C++ wrappers.
- [x] **Strict String Unions** 🟢:
    - Replace `string` with literals like `'INT32' | 'FLOAT64'` for `Datatype`.
    - Literacy for `FilterType`, `Layout`, `ArrayType`, and `QueryStatus`.
- [x] **BigInt Handling** 🟢:
    - Ensure all `uint64_t` or `int64_t` (offsets, ranges, cell counts) correctly use JavaScript `BigInt`.
- [x] **Custom Error Class** 🟢:
    - Map TileDB C API error codes to a `TileDBError` class with detailed diagnostics.
- [x] **Comprehensive JSDoc** 🟢:
    - Verified and added descriptive documentation to all exported classes and methods (Context, Array, Query, etc.).

