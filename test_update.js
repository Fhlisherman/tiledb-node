const { Config, Context, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Query, Subarray, QueryCondition } = require('./index');
const fs = require('fs');

const uri = 'test_array_update2';
if (fs.existsSync(uri)) fs.rmSync(uri, { recursive: true, force: true });

const updateConfig = new Config();
updateConfig.set('sm.allow_updates_experimental', 'true');
const updateCtx = new Context(updateConfig);

const dim = new Dimension(updateCtx, 'd1', 'INT32', 1, 10, 2);
const dom = new Domain(updateCtx);
dom.addDimension(dim);
const attr = new Attribute(updateCtx, 'a1', 'INT32');
const schema = new ArraySchema(updateCtx, 'SPARSE');
schema.setDomain(dom);
schema.addAttribute(attr);
TileDBArray.create(uri, schema);

// Write
const arrayWrite = new TileDBArray(updateCtx, uri, 'WRITE');
const queryWrite = new Query(updateCtx, arrayWrite, 'WRITE');
queryWrite.setLayout('UNORDERED');
queryWrite.setDataBuffer('d1', new Int32Array([1, 2, 3, 4, 5]));
queryWrite.setDataBuffer('a1', new Int32Array([10, 20, 30, 40, 50]));
queryWrite.submit();
queryWrite.close();
arrayWrite.close();

// Update
const arrayUpdate = new TileDBArray(updateCtx, uri, 'UPDATE');
const queryUpdate = new Query(updateCtx, arrayUpdate, 'UPDATE');
const qc = QueryCondition.create(updateCtx, 'a1', new Int32Array([25]), 'GT');
queryUpdate.setCondition(qc);
queryUpdate.addUpdateValue('a1', 99, 'INT32');
queryUpdate.submit();
queryUpdate.close();
arrayUpdate.close();

// Read
const arrayRead = new TileDBArray(updateCtx, uri, 'READ');
const queryRead = new Query(updateCtx, arrayRead, 'READ');
queryRead.setLayout('UNORDERED');
const subRead = new Subarray(updateCtx, arrayRead);
subRead.addRange('d1', 1, 5);
queryRead.setSubarray(subRead);
const readCoords = new Int32Array(5);
const readData = new Int32Array(5);
queryRead.setDataBuffer('d1', readCoords);
queryRead.setDataBuffer('a1', readData);
queryRead.submit();

console.log(queryRead.resultBufferElements());
console.log(Array.from(readCoords));
console.log(Array.from(readData));
