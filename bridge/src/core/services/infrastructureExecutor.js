import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNERS_ROOT = path.resolve(__dirname, '../../../../automation/runners');

const BUILD_RUNNER = path.join(RUNNERS_ROOT, 'wp-cli-build-runner.sh');
const HEALTH_CHECK = path.join(RUNNERS_ROOT, 'wp-cli-health-check.sh');

function runScript(scriptPath, { input, timeoutMs = 120000, args = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [scriptPath, ...args], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
      }, 5000);
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (killed) {
        const error = new Error(`${path.basename(scriptPath)} timed out after ${timeoutMs}ms`);
        error.code = 'TIMEOUT';
        reject(error);
        return;
      }
      resolve({ exitCode: code, stdout, stderr });
    });

    if (input !== undefined) {
      child.stdin.write(typeof input === 'string' ? input : JSON.stringify(input));
    }
    child.stdin.end();
  });
}

/**
 * Run a set of already-validated infrastructure actions against staging.
 * Actions are re-validated by the runner script itself against
 * wp-cli-allowlist.json -- this function does not trust the caller.
 */
export async function executeInfrastructureActions({ requestId, actions, timeoutMs }) {
  const result = await runScript(BUILD_RUNNER, {
    input: { request_id: requestId, actions },
    timeoutMs,
  });

  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // fall through, caller sees raw stdout/stderr for diagnosis
  }

  return { ...result, results: parsed };
}

/**
 * Same allowlist check the runner does before executing anything, but never
 * touches SSH. Used by n8n to show a real per-action pass/fail before
 * deciding whether to call executeInfrastructureActions at all.
 */
export async function validateInfrastructureActions({ requestId, actions }) {
  const result = await runScript(BUILD_RUNNER, {
    input: { request_id: requestId, actions },
    timeoutMs: 15000,
    args: ['--validate-only'],
  });

  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // fall through
  }

  return { ...result, results: parsed };
}

export async function checkStagingHealth() {
  const result = await runScript(HEALTH_CHECK, { timeoutMs: 30000 });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // fall through
  }
  return { ...result, health: parsed };
}
