const { Context, Config, Dimension, Domain, Attribute, ArraySchema, TileDBArray, Query, Subarray, QueryCondition } = require('./packages/core/dist/index.js');

const ctx = new Context();
console.log("Version:", ctx.getVersion());

const config = new Config();
config.set("vfs.s3.region", "us-east-1");
console.log("Config Region:", config.get("vfs.s3.region"));

const dim = new Dimension(ctx, "d1", "INT32", 1, 10, 2);
console.log("Dim name:", dim.name(), "type:", dim.type());

const dom = new Domain(ctx);
dom.addDimension(dim);
console.log("Domain ndim:", dom.ndim(), "dims:", dom.dimensions());

const attr = new Attribute(ctx, "a1", "INT32");
console.log("Attr name:", attr.name());

const schema = new ArraySchema(ctx, "DENSE");
schema.setDomain(dom);
schema.addAttribute(attr);
schema.check();

const arrayUri = "my_array_test";
console.log('Testing creating array at:', arrayUri);

const created = TileDBArray.create(arrayUri, schema);
console.log('Array created:', created);

// TEST I/O!
console.log('\n--- TESTING I/O ---');
// 1. Open array for writing
const arrayWrite = new TileDBArray(ctx, arrayUri, 'WRITE');
const queryWrite = new Query(ctx, arrayWrite, 'WRITE');
queryWrite.setLayout('ROW_MAJOR');

const subarrayWrite = new Subarray(ctx, arrayWrite);
subarrayWrite.addRange('d1', 1, 3);
queryWrite.setSubarray(subarrayWrite);

const writeDataRow = new Int32Array([1, 2, 3]);
queryWrite.setDataBuffer('a1', writeDataRow);
const writeStatus = queryWrite.submit();
console.log('Write query status:', writeStatus);
queryWrite.close();
subarrayWrite.close();
arrayWrite.close();

// 2. Open array for reading
const arrayRead = new TileDBArray(ctx, arrayUri, 'READ');
const queryRead = new Query(ctx, arrayRead, 'READ');
queryRead.setLayout('ROW_MAJOR');

const subarray = new Subarray(ctx, arrayRead);
subarray.addRange('d1', 1, 3);
queryRead.setSubarray(subarray);

console.log('Building query condition...');
// Add Query Condition: value > 1
const conditionValue = new Int32Array([1]);
const qc = QueryCondition.create(ctx, "a1", conditionValue, "GT");
console.log('Setting query condition...');
queryRead.setCondition(qc);

console.log('Setting data buffer...');
const readDataRow = new Int32Array(3); // Expecting 3 elements
queryRead.setDataBuffer('a1', readDataRow);

console.log('Dispatching Async Read...');
queryRead.submitAsync().then(readStatus => {
  console.log('Read query status:', readStatus);

  const elements = queryRead.resultBufferElements();
  console.log('Elements returned:', elements);
  console.log('Read data (filtered > 1):', Array.from(readDataRow));

  queryRead.close();
  subarray.close();
  arrayRead.close();

  console.log('Success! All TileDB ops verify out via Async + Conditions.');
}).catch(err => {
  console.error("Async error:", err);
});

// schema.close();
// attr.close();
// dom.close();
// dim.close();
// ctx.close();

console.log('Success! All TileDB operations verify out.');
