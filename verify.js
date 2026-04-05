const { Context, Config, Dimension, Domain, Attribute, ArraySchema, TileDBArray } = require('./packages/core/dist/index.js');

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

console.log("Schema valid! arrayType:", schema.arrayType());

try {
  TileDBArray.create(ctx, "my_array_test", schema);
  console.log("Array created successfully!");
} catch (e) {
  console.error("Array creation failed:", e);
}
