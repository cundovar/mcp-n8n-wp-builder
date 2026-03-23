import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
});

// Chemin relatif au fichier, pas au cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.resolve(__dirname, '..', '..', 'schemas');
const validators = new Map();
let supportedArtifactTypesCache = null;

export class UnknownArtifactTypeError extends Error {
  constructor(artifactType, supportedTypes) {
    super(`Unsupported artifact_type: ${artifactType}`);
    this.name = 'UnknownArtifactTypeError';
    this.code = 'UNKNOWN_ARTIFACT_TYPE';
    this.artifactType = artifactType;
    this.supportedTypes = supportedTypes;
  }
}

function discoverSupportedArtifactTypes() {
  if (supportedArtifactTypesCache) {
    return supportedArtifactTypesCache;
  }

  let entries = [];

  try {
    entries = fs.readdirSync(schemasDir, { withFileTypes: true });
  } catch {
    supportedArtifactTypesCache = [];
    return supportedArtifactTypesCache;
  }

  supportedArtifactTypesCache = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.schema.json'))
    .map((entry) => entry.name.replace(/\.schema\.json$/, ''))
    .sort();

  return supportedArtifactTypesCache;
}

function getSchemaPath(artifactType) {
  return path.join(schemasDir, `${artifactType}.schema.json`);
}

function loadValidator(artifactType) {
  const supportedArtifactTypes = discoverSupportedArtifactTypes();

  if (!supportedArtifactTypes.includes(artifactType)) {
    throw new UnknownArtifactTypeError(artifactType, supportedArtifactTypes);
  }

  if (validators.has(artifactType)) {
    return validators.get(artifactType);
  }

  const schemaPath = getSchemaPath(artifactType);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);
  validators.set(artifactType, validate);
  return validate;
}

export function listSupportedArtifactTypes() {
  return [...discoverSupportedArtifactTypes()];
}

export function validateArtifact(artifactType, artifact) {
  const validate = loadValidator(artifactType);
  const valid = validate(artifact);

  return {
    valid: Boolean(valid),
    errors: validate.errors || [],
  };
}
