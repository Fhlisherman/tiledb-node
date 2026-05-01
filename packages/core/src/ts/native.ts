import type { TileDBNativeBindings } from './bindings';

let nativeData: TileDBNativeBindings | undefined;

const platform = process.platform;
const arch = process.arch;

const PlatformArchMapper: Record<string, TileDBNativeBindings> = {
  "darwin-arm64": require('@tiledb-node/darwin-arm64'),
  "darwin-x64": require('@tiledb-node/darwin-x64'),
  "linux-arm64": require('@tiledb-node/linux-arm64'),
  "linux-x64": require('@tiledb-node/linux-x64'),
  "win32-x64": require('@tiledb-node/win32-x64')
}

const key = `${platform}-${arch}`;

nativeData = PlatformArchMapper[key];

if (!nativeData) {
  throw new Error(`Unsupported OS/Architecture combination: ${platform}-${arch}`);
}

export { nativeData };
