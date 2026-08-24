#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1200 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

function fail(message) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: message })}\n`);
  process.exit(1);
}

const input = await new Promise((resolve) => {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', () => {
    try { resolve(JSON.parse(raw)); } catch { fail('invalid JSON input'); }
  });
});

const requestId = String(input.request_id || '');
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(requestId)) fail('invalid request_id');
if (!Array.isArray(input.pages) || input.pages.length < 1 || input.pages.length > 30) fail('pages must contain 1-30 entries');

let baseUrl;
try { baseUrl = new URL(String(input.base_url || '')); } catch { fail('invalid base_url'); }
if (!['http:', 'https:'].includes(baseUrl.protocol)) fail('base_url must use HTTP(S)');
const allowedHosts = String(process.env.VISUAL_REVIEW_ALLOWED_HOSTS || 'wp-staging')
  .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
if (!allowedHosts.includes(baseUrl.hostname.toLowerCase())) fail('base_url host is not allowlisted');

const outputRoot = process.env.VISUAL_REVIEW_ROOT || '/tmp/wp-mcp-visual-reviews';
const outputDir = path.join(outputRoot, requestId);
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
const chromium = process.env.CHROMIUM_BIN || 'chromium';
const captures = [];

for (const page of input.pages) {
  const pageKey = String(page.page_key || '');
  const pagePath = String(page.path || '');
  if (!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(pageKey)) fail('invalid page_key');
  if (!pagePath.startsWith('/') || pagePath.includes('..') || pagePath.includes('\\')) fail('invalid page path');
  const targetUrl = new URL(pagePath, baseUrl);
  if (targetUrl.hostname !== baseUrl.hostname) fail('page URL escaped the allowlisted host');

  for (const viewport of VIEWPORTS) {
    const file = path.join(outputDir, `${pageKey}-${viewport.name}.png`);
    const result = spawnSync(chromium, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--virtual-time-budget=5000', `--window-size=${viewport.width},${viewport.height}`,
      `--screenshot=${file}`, targetUrl.toString(),
    ], { encoding: 'utf8', timeout: 30000 });
    const exists = result.status === 0 && fs.existsSync(file) && fs.statSync(file).size > 0;
    captures.push({
      page_key: pageKey,
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      url: targetUrl.toString(),
      file,
      ok: exists,
      sha256: exists ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null,
      error: exists ? null : String(result.stderr || result.error?.message || 'capture failed').slice(0, 500),
    });
  }
}

const manifest = { ok: captures.every((capture) => capture.ok), request_id: requestId, output_dir: outputDir, captures };
fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify(manifest)}\n`);
process.exit(manifest.ok ? 0 : 1);
