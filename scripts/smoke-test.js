const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const {
  StdioClientTransport
} = require('@modelcontextprotocol/sdk/client/stdio.js');

// Ce script sert de verification minimale apres build.
//
// Idee:
// - il lance localement `dist/index.js` comme un vrai client MCP le ferait
// - il ouvre une connexion stdio
// - il demande `listTools`
// - il affiche un petit resume lisible
//
// Il ne teste pas toute la logique n8n, mais il valide au moins:
// - que le serveur demarre
// - que le protocole MCP repond
// - que la liste des outils est recuperable
async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(__dirname, '..', 'dist', 'index.js')],
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stderr: 'pipe'
  });

  let stderrBuffer = '';
  if (transport.stderr) {
    // Les logs humains du serveur vont sur stderr.
    // On les garde pour aider au diagnostic si la connexion MCP echoue.
    transport.stderr.on('data', chunk => {
      stderrBuffer += chunk.toString();
    });
  }

  const client = new Client({
    name: 'local-smoke-test',
    version: '1.0.0'
  });

  try {
    await client.connect(transport);
    const server = client.getServerVersion();
    const result = await client.listTools();
    const tools = Array.isArray(result.tools) ? result.tools : [];

    console.log(`MCP OK: ${server?.name || 'unknown'} ${server?.version || ''}`.trim());
    console.log(`Tools exposes: ${tools.length}`);

    const preview = tools.slice(0, 5).map(tool => tool.name);
    if (preview.length > 0) {
      console.log(`Exemples: ${preview.join(', ')}`);
    }
  } catch (error) {
    console.error(`Smoke test MCP echoue: ${error.message}`);
    if (stderrBuffer.trim()) {
      console.error('\n[stderr]');
      console.error(stderrBuffer.trim());
    }
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
