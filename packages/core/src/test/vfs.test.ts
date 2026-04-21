import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Context, Config, VFS, TileDBError } from '../ts/index';
import * as fs from 'fs';
import * as path from 'path';

describe('VFS', () => {
  let ctx: Context;
  let vfs: VFS;
  let config: Config;

  const testDir = path.join(__dirname, 'vfs_test_dir');
  const testFileURI = path.join(testDir, 'test_file.txt');
  const copyFileURI = path.join(testDir, 'test_file_copy.txt');
  const moveFileURI = path.join(testDir, 'test_file_move.txt');

  beforeEach(() => {
    config = new Config();
    // Use smaller fragments or custom config if necessary
    ctx = new Context(config);
    vfs = new VFS(ctx, config);

    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // Create base dir for tests
    vfs.createDir(testDir);
  });

  afterEach(() => {
    // Cleanup using standard fs as fallback
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    if (vfs) vfs.close();
    if (ctx) ctx.close();
    if (config) config.close();
  });

  it('should correctly identify and create directories', () => {
    const newDir = path.join(testDir, 'new_dir');
    expect(vfs.isDir(newDir)).toBe(false);
    vfs.createDir(newDir);
    expect(vfs.isDir(newDir)).toBe(true);
    
    const size = vfs.dirSize(newDir);
    expect(size).toBeGreaterThanOrEqual(0); // empty dir might be 0
    
    vfs.removeDir(newDir);
    expect(vfs.isDir(newDir)).toBe(false);
  });

  it('should handle file creation, writing and reading with handlers', () => {
    expect(vfs.isFile(testFileURI)).toBe(false);
    
    // Use touch
    vfs.touch(testFileURI);
    expect(vfs.isFile(testFileURI)).toBe(true);

    // Write to file
    vfs.open(testFileURI, 'write');
    const content = Buffer.from('hello tiledb vfs');
    vfs.write(content);
    vfs.close(); // Need to close file opened in vfs instance
    
    expect(vfs.fileSize(testFileURI)).toBe(content.length);

    // Read from file
    vfs.open(testFileURI, 'read');
    const readBuf = vfs.read(0, content.length);
    vfs.close();
    
    expect(readBuf.toString()).toBe('hello tiledb vfs');
    
    // Remove the file
    vfs.removeFile(testFileURI);
    expect(vfs.isFile(testFileURI)).toBe(false);
  });

  it('should move and copy files', () => {
    vfs.touch(testFileURI);
    vfs.open(testFileURI, 'write');
    vfs.write(Buffer.from('copy-move-test'));
    vfs.close();

    // Copy
    vfs.copyFile(testFileURI, copyFileURI);
    expect(vfs.isFile(copyFileURI)).toBe(true);
    expect(vfs.fileSize(copyFileURI)).toBe(vfs.fileSize(testFileURI));
    
    // Move
    vfs.moveFile(copyFileURI, moveFileURI);
    expect(vfs.isFile(copyFileURI)).toBe(false);
    expect(vfs.isFile(moveFileURI)).toBe(true);
  });
  
  it('should list directory contents (ls)', () => {
    vfs.touch(path.join(testDir, 'file1'));
    vfs.touch(path.join(testDir, 'file2'));
    vfs.createDir(path.join(testDir, 'dir1'));
    
    const children = vfs.ls(testDir);
    expect(children.length).toBeGreaterThanOrEqual(3);
    
    // Convert to canonical basenames if paths are absolute
    const baseNames = children.map(c => path.basename(c));
    expect(baseNames).toContain('file1');
    expect(baseNames).toContain('file2');
    expect(baseNames).toContain('dir1');
  });

  it('should throw TileDBError for invalid file operations', () => {
    try {
        vfs.open('/invalid/path/that/does/not/exist.txt', 'read');
        // should never reach here
        expect(false).toBe(true);
    } catch (e: any) {
        expect(e).toBeInstanceOf(TileDBError);
    }
  });
});
