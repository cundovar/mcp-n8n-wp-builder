# Hybrid orchestration — status au 2026-08-23

Reference: `n8n-wordpress-hybrid-orchestration-plan.zip` (repo root) / `aidd_docs/tasks/2026_08/2026_08_22_n8n-wordpress-hybrid-orchestration/` (repo `wp-mcp`). Objectif du plan: un contrat de site validé peut être construit de façon répétable sur un WordPress de staging, revu indépendamment, corrigé, publié seulement après approbation humaine.

## Vue d'ensemble de l'architecture

```
front (à construire plus tard) / curl de test
  → n8n "00-site-build-intake"        (validation, machine à états, visible dans n8n)
  → bridge (mcp-n8n-wp-builder)        (persistance MongoDB, garde-fous de transition)
  → n8n "10-wordpress-infrastructure"  (agent codex → allow-list WP-CLI → SSH staging)
  → n8n "20-wordpress-builder"         (agent codex → policy MCP → wp-mcp sur staging)
  → [Phase 4, pas commencée] revue indépendante → correction → publication
```

Principe tenu tout du long: **la logique de décision vit dans des nodes n8n visibles** (Code/IF inspectables par exécution), le bridge et les runners ne font que du stockage + des garde-fous de sécurité en profondeur (re-validation indépendante de ce que n8n a décidé).

## Ce qui est fait et testé en direct

### Préalable — infrastructure serveur
- Bridge (`mcp-bridge`) et n8n reliés correctement (URLs, credential `X-Bridge-Token`, `N8N_WEBHOOK_URL`) — voir commits `4708010` et antérieurs sur `deploy`.
- **WordPress de staging jetable** (`wp-staging` + `wp-staging-db`, définis dans `/srv/config/wp-staging/`, hors repo git public) : SSH par clé (pas de mot de passe), WP-CLI, sur le réseau `mcp_net` donc joignable depuis le bridge et n8n. Clé privée montée en lecture seule dans le bridge (`/seed/wp-staging-key`).

### Phase 1 — Intake & gates (commit `0885d8d`)
- Schémas (`automation/contracts/*.schema.json`) + policy d'états (`automation/policies/build-state-policy.json`).
- Modèle `Request` (Mongo) étendu avec un sous-document `contract` (build_state, state_history, missing_information, risks...) — pas de nouvelle Data Table n8n, réutilise le stockage existant.
- Bridge : `PUT /contracts/:id` (persistance pure), `POST /contracts/:id/approve-staging`, `GET /contracts/:id`.
- n8n `00-site-build-intake` (ID `VEKYSDpw3JPWvHh8`, **actif**) — 2 webhooks : `site-build-intake` (soumission) et `site-build-intake-approve` (approbation humaine). Toute la logique (validation de version, détection d'infos manquantes, évaluation de risque → dry_run forcé) est dans des nodes Code/IF visibles.
- Testé : contrat incomplet → `needs_input` ; contrat complet → `awaiting_staging_approval` ; version invalide → 400 ; risque critique non mitigé → dry_run forcé ; approbation → `ready_for_staging`, idempotente, refusée si mauvais état.

### Phase 2 — Exécuteur WP-CLI restreint (commit `db1edeb`)
- `automation/policies/wp-cli-allowlist.json` — vocabulaire strict (install/activate thème+plugin, update_option sur des clés fixes, flush_permalinks, opérations de menu).
- `automation/runners/wp-cli-build-runner.sh` (+ `wp-cli-health-check.sh`) — re-valide chaque action indépendamment de n8n (défense en profondeur), exécute via SSH avec avant/après par action. Mode `--validate-only` pour que n8n voie un vrai résultat par action sans toucher SSH.
- Bridge : `/infrastructure/{execute,validate,health}`, plus `POST /contracts/:id/transition` et `PUT /contracts/:id/stage-artifacts` génériques (réutilisés par la Phase 3).
- n8n `10-wordpress-infrastructure` (ID `WPINFRA2Phase0001`, **actif**) — webhook `wordpress-infrastructure`. Agent (codex) propose des actions → validation visible (`IF All Valid`) → transition `building` → exécution → stockage résultat.
- **3 bugs trouvés en testant pour de vrai, tous corrigés** : SSH ne transmet pas les variables d'environnement du conteneur (fix: `PermitUserEnvironment` + fichier `~/.ssh/environment`) ; le grep busybox d'Alpine casse sur les regex `{n,m}` (fix: paquet GNU `grep`) ; les valeurs avec espaces se redécoupaient en plusieurs arguments côté SSH (fix: `printf %q` avant l'envoi).
- Testé : 18/18 actions exécutées avec succès (thème Astra, WPForms, Yoast SEO, Wordfence, UpdraftPlus, menu).

### Phase 3 — Construction MCP idempotente (EN COURS, pas encore commité)
- Le plugin **wp-mcp** (`github.com/cundovar/wp-mcp`, cloné dans `/srv/apps/wp-mcp`) a déjà, dans son propre commit `95edd6f` (fait par l'utilisateur) : `upsert_post` idempotent (`request_id`+`artifact_key`, verrou atomique anti-race), capacités WordPress par objet, validation upload media à 4 couches. Testé avec les 2 suites de tests du repo (exécutées via PHP-CLI dans le conteneur `wp-staging`) — **passent réellement**.
- Plugin installé et activé sur `wp-staging`, token Bearer MCP configuré (`wp_mcp_bearer_token` / `wp_mcp_bearer_user_id`, utilisateur admin WP id 1).
- `automation/policies/mcp-tool-policy.json` — outils autorisés (`upsert_post`, `get_post`, `list_categories`, `create_category`), tout le reste refusé par défaut (Elementor, Woo, delete, upload_media = itérations futures). Garde-fou "placeholder non résolu → jamais publishable, status forcé à draft".
- n8n `20-wordpress-builder` (ID `WPBUILD3Phase0001`, **actif**) — webhook `wordpress-builder`. Agent (codex) propose des artefacts de page → gate de publication visible → upsert via MCP (JSON-RPC) → **vérification par relecture** (`get_post` après chaque upsert) → manifest → transition `reviewing`.
- **Bug trouvé et corrigé, PAS ENCORE RE-TESTÉ** : les nodes Code `Parse Upsert Result` et `Build Manifest Entry` tournaient en mode "une fois pour tous les items" (comportement par défaut d'un node Code n8n) au lieu de traiter chaque item du fan-out — résultat : sur 3 pages proposées et créées avec succès (vérifié via `wp post list`), le manifest final n'en contenait qu'une seule. Corrigé en réécrivant ces deux nodes avec une boucle explicite `$input.all().map(...)`. **Réimporté et republié dans n8n mais le retest de bout en bout a été interrompu — c'est la toute première chose à vérifier demain.**

## État exact du staging au moment de la pause

- `wp-staging` : 2 pages WordPress par défaut seulement (Sample Page, Privacy Policy) — les pages de test ont été nettoyées.
- Un menu **"Menu principal" existe déjà** (term_id 4, assigné à l'emplacement `primary`) — créé par un run Phase 2 précédent.
- La requête de test `phase3-e2e-003` est en état **`failed`** : son run Phase 2 a échoué sur `create_menu` car "Menu principal" existe déjà (`wp menu create` n'est pas idempotent nativement — limitation connue, pas un bug du pipeline). À supprimer (`DELETE /requests/phase3-e2e-003`) avant de rejouer un test, ou repartir avec un nouveau `request_id`.

## Ce qui reste à faire

1. **Vérifier le fix de la Phase 3** (priorité immédiate) — rejouer intake → approve → infra → builder avec un `request_id` neuf, confirmer que le manifest contient bien les 3 artefacts avec `verified: true`.
2. **Committer + pousser le fix Phase 3** sur `deploy` une fois vérifié (`automation/workflows/20-wordpress-builder.json` actuellement commité est encore la version buggée).
3. **Idempotence de `create_menu`** — ajouter une vérification d'existence avant création (soit dans le prompt de l'agent en lui donnant un outil de lecture, soit dans l'allow-list/runner) pour respecter la tâche 2 de la Phase 2 du plan ("safe to retry").
4. **Chaînage automatique Phase 1 → Phase 2 → Phase 3** — actuellement déclenché manuellement (curl séparés). Le plan (tâche 4, Phase 1) demande que l'approbation déclenche automatiquement la suite. Nécessite un mécanisme asynchrone (l'exécution complète prend 100s+, trop long pour bloquer la réponse HTTP de l'approbateur).
5. **Phase 4** (pas commencée) — reviewer indépendant en lecture seule, boucle de correction bornée, gate de publication humaine avec checksum. C'est aussi l'étape qui donnera un vrai signal sur la qualité des prompts des agents Phase 2/3 (cf. point 6).
6. **Revue des prompts des agents IA** — les prompts actuels (`Build Agent Prompt` en Phase 2, `Build Content Agent Prompt` en Phase 3) sont volontairement minimaux, écrits pour prouver la mécanique du pipeline, pas la qualité du contenu. Décision prise : attendre que la Phase 4 existe pour avoir un signal concret plutôt que deviner.
7. **Moteur `claude`** — session OAuth expirée dans le conteneur bridge (`Failed to authenticate: OAuth session expired`). Tous les agents utilisent `codex` en attendant. Si `claude` est voulu, il faut se reconnecter localement puis rafraîchir le fichier seedé dans le bridge.
8. **Mémoire n8n** — le conteneur `n8n` a redémarré seul de très nombreuses fois pendant la session (`mem_limit: 600m` dans `n8n/docker-compose.yml`, usage de base déjà ~60-80% juste au démarrage). Recommandé : monter à 1-1.5GB. Cause probable de plusieurs échecs de commandes CLI pendant les tests (non lié à la logique des workflows elle-même).
9. **SMTP** — credential `SMTP account` créé dans n8n mais jamais câblé à un node ; pertinent seulement si le Core Pipeline (V1, désormais obsolète) est ranimé, sinon sans objet.

## Identifiants et emplacements (valeurs non répétées ici pour rester public-repo-safe)

| Élément | Où le trouver |
| --- | --- |
| Token webhook Phase 1/2/3 (`X-Intake-Token`) | credential n8n **Site Build Intake Token** (id `TINskEJG2pAFYwcv`) |
| Token interne bridge (`X-Bridge-Token`) | credential n8n **Header Auth account** (id `32Y7qJF1EaigIR6t`) ; valeur dans `/srv/config/mcp-n8n-wp-builder/.env` |
| Token MCP staging | credential n8n **WP Staging MCP Token** (id `Yo9eorpphgq9v3VJ`) ; option WP `wp_mcp_bearer_token` (hashé) sur `wp-staging` |
| Clé SSH staging | `/srv/config/wp-staging/ssh_keys/wpcli_staging_key` (hôte), montée `:ro` dans le bridge |
| IDs workflows n8n | `00-site-build-intake` = `VEKYSDpw3JPWvHh8` · `10-wordpress-infrastructure` = `WPINFRA2Phase0001` · `20-wordpress-builder` = `WPBUILD3Phase0001` |

## Comment reprendre demain

```bash
# 1. Nettoyer la requête de test cassée
curl -X DELETE https://wp-builder.varascundo.com/requests/phase3-e2e-003

# 2. Nouveau cycle complet (remplacer le token par la valeur réelle, voir credential n8n)
curl -X POST https://n8n.varascundo.com/webhook/site-build-intake -H "X-Intake-Token: ..." -d '{...}'
curl -X POST https://n8n.varascundo.com/webhook/site-build-intake-approve -H "X-Intake-Token: ..." -d '{"request_id":"...","actor":"human-reviewer"}'
curl -X POST https://n8n.varascundo.com/webhook/wordpress-infrastructure -H "X-Intake-Token: ..." -d '{"request_id":"..."}'
curl -X POST https://n8n.varascundo.com/webhook/wordpress-builder -H "X-Intake-Token: ..." -d '{"request_id":"..."}'

# 3. Vérifier le manifest final
curl https://wp-builder.varascundo.com/requests/<request_id> | jq '.contract.stage_artifacts.build_manifest'
```
