const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const REFERENCE = /^\{([A-Za-z0-9_.-]+)\}$/;

export function resolveToken(palette, reference, seen = new Set()) {
  if (typeof reference !== 'string') {
    throw new Error(`Token reference or value must be a string. Received: ${typeof reference}`);
  }

  const match = REFERENCE.exec(reference);
  if (!match) {
    if (!HEX_COLOR.test(reference)) {
      throw new Error(`Invalid hexadecimal color: ${reference}`);
    }
    return reference.toUpperCase();
  }

  const pathString = match[1];
  if (seen.has(pathString)) {
    throw new Error(`Circular token reference detected: ${[...seen, pathString].join(' -> ')}`);
  }

  const token = pathString.split('.').reduce((cursor, key) => cursor?.[key], palette);
  if (!token || typeof token !== 'object' || typeof token.$value !== 'string') {
    throw new Error(`Missing or invalid token path: ${pathString}`);
  }

  return resolveToken(palette, token.$value, new Set([...seen, pathString]));
}

export function resolveNamedPath(palette, tokenPath) {
  return resolveToken(palette, `{${tokenPath}}`);
}
