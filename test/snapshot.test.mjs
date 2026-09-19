import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { readAndValidateLock } from '../src/lock.mjs';

const vendorDir = path.resolve('vendor/static-noise');
const lockPath = path.resolve('static-noise.lock.json');

describe('vendor snapshot integrity', () => {
  it('matches the version declared in static-noise.lock.json', async () => {
    const lock = await readAndValidateLock(lockPath);
    const paletteRaw = await readFile(path.join(vendorDir, 'palette.json'), 'utf8');
    const palette = JSON.parse(paletteRaw);

    expect(palette.version).toBe(lock.version);
    expect(palette.name).toBe('Static Noise');
  });

  it('validates successfully against the vendored schema', async () => {
    const paletteRaw = await readFile(path.join(vendorDir, 'palette.json'), 'utf8');
    const schemaRaw = await readFile(path.join(vendorDir, 'palette.schema.json'), 'utf8');

    const palette = JSON.parse(paletteRaw);
    const schema = JSON.parse(schemaRaw);

    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(palette);

    expect(valid).toBe(true);
  });
});
