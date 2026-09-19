const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const DTCG_REFERENCE_PATTERN = /^\{([A-Za-z0-9_.-]+)\}$/;

/**
 * Resolves a DTCG token value or reference string to its final normalized #RRGGBB hex color.
 * Detects circular references and reports missing paths explicitly.
 */
export function resolveToken(palette, reference, visitedPaths = new Set()) {
  if (typeof reference !== 'string') {
    throw new Error(`Token reference or value must be a string. Received: ${typeof reference}`);
  }

  const match = DTCG_REFERENCE_PATTERN.exec(reference);
  if (!match) {
    if (!HEX_COLOR_PATTERN.test(reference)) {
      throw new Error(`Invalid hexadecimal color format: '${reference}'`);
    }
    return reference.toUpperCase();
  }

  const tokenPath = match[1];
  if (visitedPaths.has(tokenPath)) {
    const cycle = [...visitedPaths, tokenPath].join(' -> ');
    throw new Error(`Circular token reference detected: ${cycle}`);
  }

  const tokenObject = tokenPath.split('.').reduce((scope, key) => scope?.[key], palette);
  if (!tokenObject || typeof tokenObject !== 'object' || typeof tokenObject.$value !== 'string') {
    throw new Error(`Missing or invalid token path in palette: '${tokenPath}'`);
  }

  return resolveToken(palette, tokenObject.$value, new Set([...visitedPaths, tokenPath]));
}

/**
 * Convenience helper to resolve a dotted path (e.g. 'semantic.surface.canvas').
 */
export function resolveNamedPath(palette, tokenPath) {
  return resolveToken(palette, `{${tokenPath}}`);
}
