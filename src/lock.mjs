import { readFile } from 'node:fs/promises';
import path from 'node:path';

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const REPO_URL_OR_PATH_PATTERN = /^(?:https:\/\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*?(?:\.git)?|\/(?:[^/\0]+\/)*[^/\0]+)$/;

const REQUIRED_LOCK_FIELDS = ['repository', 'version', 'sha'];

/**
 * Validates the in-memory structure and values of a lock object.
 * Pure function: no disk I/O, easy to test and reason about.
 */
export function validateLockStructure(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Lockfile must be a valid JSON object');
  }

  const actualKeys = Object.keys(data);
  const hasExactKeys = actualKeys.length === REQUIRED_LOCK_FIELDS.length &&
    REQUIRED_LOCK_FIELDS.every((key) => actualKeys.includes(key));

  if (!hasExactKeys) {
    throw new Error(`Lockfile must contain exactly ${REQUIRED_LOCK_FIELDS.join(', ')}. Received: ${actualKeys.join(', ')}`);
  }

  if (typeof data.repository !== 'string' || !REPO_URL_OR_PATH_PATTERN.test(data.repository)) {
    throw new Error(`Invalid repository URL: ${data.repository}`);
  }

  if (typeof data.version !== 'string' || !SEMVER_PATTERN.test(data.version)) {
    throw new Error(`Invalid semantic version: ${data.version}`);
  }

  if (typeof data.sha !== 'string' || !COMMIT_SHA_PATTERN.test(data.sha)) {
    throw new Error(`Invalid commit SHA (must be 40 lowercase hex characters): ${data.sha}`);
  }

  return {
    repository: data.repository,
    version: data.version,
    sha: data.sha
  };
}

/**
 * Reads and validates static-noise.lock.json from disk.
 */
export async function readAndValidateLock(filePath = path.resolve('static-noise.lock.json')) {
  let fileContent;
  try {
    fileContent = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read lockfile at ${filePath}: ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Invalid JSON in lockfile: ${error.message}`);
  }

  return validateLockStructure(parsed);
}
