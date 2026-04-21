class Native {
  constructor() {
    this.val = 42;
  }
  getVal() {
    if (this.val !== 42) throw new Error("bad this");
    throw new Error("[TileDB::Test] Error: something failed");
  }
}
const orig = new Native();
const p = new Proxy(orig, {
  get(target, prop, receiver) {
    const fn = Reflect.get(target, prop, receiver);
    if (typeof fn === 'function') {
      return function(...args) {
        try {
          return fn.apply(target, args);
        } catch(e) {
          throw new Error("PROXIED: " + e.message);
        }
      }
    }
    return fn;
  }
});
try {
  p.getVal();
} catch(e) {
  console.log(e.message);
}
