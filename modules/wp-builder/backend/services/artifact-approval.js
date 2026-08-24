export const REQUIRED_BUILD_ARTIFACTS = Object.freeze([
  'site_architecture',
  'content_plan',
  'design_plan',
  'wordpress_plan',
  'execution_plan',
]);

export async function verifyApprovedArtifacts(requestId, approvedVersions, getArtifact) {
  const artifacts = {};
  const errors = [];

  for (const artifactType of REQUIRED_BUILD_ARTIFACTS) {
    const version = Number(approvedVersions?.[artifactType] || 0);
    if (!Number.isInteger(version) || version < 1) {
      errors.push(`${artifactType}: approved version missing`);
      continue;
    }

    const artifact = await getArtifact(requestId, artifactType, version);
    if (!artifact) {
      errors.push(`${artifactType}: version ${version} not found`);
      continue;
    }
    if (artifact.status !== 'validated') {
      errors.push(`${artifactType}: version ${version} is ${artifact.status}, not validated`);
      continue;
    }

    artifacts[artifactType] = {
      artifact_type: artifactType,
      version,
      status: artifact.status,
      payload: artifact.payload,
    };
  }

  return { artifacts, errors };
}
