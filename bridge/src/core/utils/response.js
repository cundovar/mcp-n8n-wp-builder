/**
 * Build a standardized success response
 */
export function buildSuccess({ engine, exitCode, durationMs, stdout, stderr, parsedJson, meta }) {
  return {
    ok: true,
    engine,
    exit_code: exitCode,
    duration_ms: durationMs,
    stdout: stdout || '',
    stderr: stderr || '',
    parsed_json: parsedJson || null,
    error_type: null,
    meta: meta || {},
  };
}

/**
 * Build a standardized error response
 */
export function buildError({ engine, exitCode, durationMs, stdout, stderr, errorType, message, meta }) {
  return {
    ok: false,
    engine,
    exit_code: exitCode ?? -1,
    duration_ms: durationMs ?? 0,
    stdout: stdout || '',
    stderr: stderr || message || '',
    parsed_json: null,
    error_type: errorType || 'execution_error',
    meta: meta || {},
  };
}

/**
 * Try to extract JSON from stdout
 * Handles cases where JSON is wrapped in markdown code blocks or has extra text
 */
export function tryParseJson(stdout) {
  if (!stdout || typeof stdout !== 'string') {
    return null;
  }

  const trimmed = stdout.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to other methods
  }

  // Try to extract JSON from markdown code block
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Try to find JSON object or array in the text
  const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Give up
    }
  }

  return null;
}

/**
 * Truncate string to max length
 */
export function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + `\n... [truncated, ${str.length - maxLength} more bytes]`;
}
