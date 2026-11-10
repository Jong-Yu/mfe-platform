import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

// New releases identify the actual exposed chunk. Retained Webpack snapshots
// predate this metadata and have exactly one src_* execution chunk.
export async function exposeChunkPath(storeDirectory, release, exposedModule) {
  let filename = release.exposeChunks?.[exposedModule];
  if (!filename) {
    assert.notEqual(release.format, 'esm', `Missing exposed chunk metadata: ${release.id} ${exposedModule}`);
    const files = await readdir(path.join(storeDirectory, 'artifacts', release.id));
    const chunks = files.filter((file) => file.startsWith('src_') && file.endsWith('.js'));
    assert.equal(chunks.length, 1, `Expected one legacy execution chunk for ${release.id}`);
    [filename] = chunks;
  }
  assert.equal(typeof filename, 'string');
  assert(!path.posix.isAbsolute(filename) && !filename.split('/').includes('..'), `Invalid exposed chunk path: ${filename}`);
  return `/artifacts/${release.id}/${filename}`;
}
