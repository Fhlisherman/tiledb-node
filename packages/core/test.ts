import { Context } from './src/ts/index';

const ctx = new Context();
console.log('TileDB Loaded Successfully!');
console.log('Version:', ctx.getVersion());
