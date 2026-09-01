# Workflow DevDoc : génération de cours

`50-devdoc-course-batch.json` est volontairement **inactif** à l'import. Il ne
modifie aucun workflow WordPress existant.

## Variables n8n

```dotenv
DEVDOC_MCP_URL=http://<nom-tailscale-ou-ip>:<port>
DEVDOC_MCP_TOKEN=<jeton-Bearer-dedie>
```

Le workflow accepte un lot avec un `externalId` unique pour chaque cours. Il
prépare l'arborescence, traite les cours séparément, relance la correction après
un refus et arrête après trois vérifications. Les appels HTTP utilisent la
progression d'exécution n8n ; une reprise avec le même `batchId` et le même
`externalId` réutilise la génération Symfony.

Avant activation, installer et connecter Tailscale sur Netcup, puis vérifier
depuis le conteneur n8n l'endpoint `/health` et un appel de lecture authentifié.
Les clés OpenAI et DeepSeek restent uniquement dans le MCP.
