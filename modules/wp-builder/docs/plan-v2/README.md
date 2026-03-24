# Plan V2

Ce dossier organise la refactorisation `WP Site Builder V2` en lots cohérents, pensés pour être exécutés par un ou plusieurs agents IA.

## Objectif

Transformer la V1 actuelle en pipeline V2 avec :

- contrats JSON formels
- stockage des artefacts intermédiaires
- boucle de validation et révision
- exécution WordPress séparée
- observabilité et reprise

## Structure

- [01-roadmap.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/01-roadmap.md)
  Vue d'ensemble, ordre des lots, dépendances, critères de fin.
- [02-contracts-and-schemas.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/02-contracts-and-schemas.md)
  Contrats JSON, schémas, graphe de dépendances.
- [03-bridge-backend.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/03-bridge-backend.md)
  Modèles Mongo, services backend, routes API.
- [04-n8n-workflows.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/04-n8n-workflows.md)
  Découpage cible des workflows n8n.
- [05-frontend.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/05-frontend.md)
  Écrans, états UI, validation, révisions, exécution.
- [06-agent-work-packages.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/06-agent-work-packages.md)
  Découpage concret des tâches par agent IA.

## Règle de travail

Chaque lot doit préciser :

- périmètre
- fichiers touchés
- dépendances
- livrables attendus
- critères d'acceptation

## Ordre recommandé

1. contrats et schémas
2. bridge backend
3. workflows n8n de planification
4. frontend pipeline / artefacts / validation
5. exécution WordPress
6. observabilité et reprise
