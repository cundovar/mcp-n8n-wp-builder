import { spawn } from 'node:child_process';
import path from 'node:path';
import config from '../../../config/default.js';
import { buildSuccess, buildError, tryParseJson, truncate } from '../utils/response.js';

/**
 * Confine un cwd fourni par le client sous config.workspaceRoot.
 *
 * La comparaison se fait sur les chemins résolus, ce qui neutralise aussi bien
 * les chemins absolus ('/etc') que les remontées relatives ('../..').
 * Retourne null si le chemin sort de la racine autorisée.
 */
export function resolveCwd(cwd) {
  const root = path.resolve(config.workspaceRoot);
  const target = path.resolve(root, cwd ?? '.');

  if (target !== root && !target.startsWith(root + path.sep)) {
    return null;
  }

  return target;
}

/**
 * Execute a CLI command (codex or claude)
 */
export async function executeTask({ engine, prompt, cwd, timeoutMs, expectJson, context }) {
  const startTime = Date.now();
  const engineConfig = config.engines[engine];

  if (!engineConfig) {
    return buildError({
      engine,
      errorType: 'invalid_engine',
      message: `Unknown engine: ${engine}. Valid engines: codex, claude`,
      meta: context,
    });
  }

  const safeCwd = resolveCwd(cwd);

  if (!safeCwd) {
    return buildError({
      engine,
      errorType: 'invalid_cwd',
      message: `cwd must stay inside the workspace root (${config.workspaceRoot})`,
      meta: context,
    });
  }

  const timeout = Math.min(timeoutMs || engineConfig.defaultTimeout, config.timeouts.max);

  try {
    const result = await spawnCli({
      command: engineConfig.command,
      prompt,
      cwd: safeCwd,
      timeout,
    });

    const durationMs = Date.now() - startTime;
    const stdout = truncate(result.stdout, config.limits.maxOutputSize);
    const stderr = truncate(result.stderr, config.limits.maxOutputSize);

    if (result.exitCode !== 0) {
      return buildError({
        engine,
        exitCode: result.exitCode,
        durationMs,
        stdout,
        stderr,
        errorType: 'execution_error',
        meta: context,
      });
    }

    let parsedJson = null;
    if (expectJson) {
      parsedJson = tryParseJson(result.stdout);
      if (!parsedJson) {
        return buildError({
          engine,
          exitCode: result.exitCode,
          durationMs,
          stdout,
          stderr,
          errorType: 'parse_error',
          message: 'Expected JSON output but could not parse',
          meta: context,
        });
      }
    }

    return buildSuccess({
      engine,
      exitCode: result.exitCode,
      durationMs,
      stdout,
      stderr,
      parsedJson,
      meta: context,
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (error.code === 'TIMEOUT') {
      return buildError({
        engine,
        durationMs,
        errorType: 'timeout',
        message: `Process timed out after ${timeout}ms`,
        meta: context,
      });
    }

    return buildError({
      engine,
      durationMs,
      errorType: 'spawn_error',
      message: error.message,
      meta: context,
    });
  }
}

/**
 * Spawn a CLI process with timeout
 */
function spawnCli({ command, prompt, cwd, timeout }) {
  return new Promise((resolve, reject) => {
    const args = buildArgs(command, prompt);
    const options = {
      // Déjà résolu et validé par resolveCwd() dans executeTask().
      cwd,
      env: { ...process.env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    };

    const child = spawn(command, args, options);

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (killed) {
        const error = new Error('Process timed out');
        error.code = 'TIMEOUT';
        reject(error);
        return;
      }

      resolve({
        exitCode: code,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Build CLI arguments based on the command
 *
 * codex: uses `codex exec "prompt"` for non-interactive execution
 * claude: uses `claude -p "prompt"` for non-interactive output
 */
function buildArgs(command, prompt) {
  if (command === 'codex' || command.includes('codex')) {
    // codex exec <prompt> runs non-interactively
    // --skip-git-repo-check allows running outside git repos
    // Le sandbox interne de codex (workspace-write) repose sur bubblewrap, qui
    // ne peut pas créer de namespace dans un conteneur non privilégié :
    // "bwrap: No permissions to create a new namespace". Y remédier
    // demanderait SYS_ADMIN, donc d'affaiblir le conteneur pour dupliquer une
    // isolation qu'il fournit déjà. On laisse donc le conteneur faire office de
    // bac à sable : seul /workspace est monté depuis l'hôte, et resolveCwd()
    // confine l'exécution à cette racine.
    return [
      'exec',
      '--skip-git-repo-check',
      '--sandbox',
      'danger-full-access',
      '--color',
      'never',
      prompt,
    ];
  }

  if (command === 'claude' || command.includes('claude')) {
    // acceptEdits : sans TTY, une demande d'autorisation bloquerait le process.
    return ['-p', '--permission-mode', 'acceptEdits', prompt];
  }

  // Generic fallback
  return [prompt];
}
