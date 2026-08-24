# Hybrid orchestration — status au 2026-08-23 (mis à jour: Phase 4 committée)

Reference: `n8n-wordpress-hybrid-orchestration-plan.zip` (repo root) / `aidd_docs/tasks/2026_08/2026_08_22_n8n-wordpress-hybrid-orchestration/` (repo `wp-mcp`). Objectif du plan: un contrat de site validé peut être construit de façon répétable sur un WordPress de staging, revu indépendamment, corrigé, publié seulement après approbation humaine.

## Vue d'ensemble de l'architecture

```
front (à construire plus tard) / curl de test
  → n8n "00-site-build-intake"        (validation, machine à états, visible dans n8n)
  → bridge (mcp-n8n-wp-builder)        (persistance MongoDB, garde-fous de transition)
  → n8n "10-wordpress-infrastructure"  (agent codex → allow-list WP-CLI → SSH staging)
  → n8n "20-wordpress-builder"         (agent codex → policy MCP → wp-mcp sur staging)
  → n8n "30-wordpress-review"          (agent lecture-seule + checks déterministes → verdict)
  → n8n "35-wordpress-correction-loop" (correction bornée, uniquement si changes_requested)
  → n8n "40-wordpress-publish"         (approbation humaine + checksum → adapter → smoke checks)
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
- **Bug trouvé et corrigé** : les nodes Code `Parse Upsert Result` et `Build Manifest Entry` tournaient en mode "une fois pour tous les items" (comportement par défaut d'un node Code n8n) au lieu de traiter chaque item du fan-out — résultat : sur 3 pages proposées et créées avec succès (vérifié via `wp post list`), le manifest final n'en contenait qu'une seule. Corrigé en réécrivant ces deux nodes avec une boucle explicite `$input.all().map(...)`.
- **Committé sur `deploy` (commit `7034cbc`)** : `automation/policies/mcp-tool-policy.json` + `automation/workflows/20-wordpress-builder.json` (version corrigée, exportée depuis n8n). **Le retest de bout en bout du fix n'a PAS été rejoué** — décision prise de committer directement sans repasser par un cycle e2e complet (le fix est structurellement identique au pattern déjà validé en Phase 2/3 pour `Parse Upsert Result`/`Build Manifest Entry`). À garder en tête si un manifest incomplet réapparaît.

### Phase 4 — Revue indépendante, boucle de correction, gate de publication (commit à venir)
- `automation/policies/review-policy.json` — reviewer restreint à `list_posts`/`get_post`/`list_categories` (aucun outil mutant). Vérifications déterministes (pages requises présentes, pas de placeholder non résolu dans le contenu live, chaque entrée manifest `verified:true`) codées dans des nodes Code visibles et **toujours prioritaires** sur le verdict de l'agent — un agent ne peut pas approuver au-delà d'un check qu'il ne voit pas.
- `automation/policies/publication-policy.json` — définit `build_checksum` (FNV-1a, non cryptographique, juste de la détection de staleness), les champs d'approbation requis (`request_id`, `actor`, `build_checksum`, `target_environment`, `expiry`), et le contrat de l'adapter de production.
- Bridge : nouvel endpoint `POST /contracts/:id/approve-publish` — re-valide indépendamment état/checksum/expiry (défense en profondeur, même principe que le runner Phase 2), transitionne `awaiting_publish_approval → publishing`. Aucun autre endpoint bridge n'était nécessaire — `/transition` et `/stage-artifacts` génériques couvrent déjà tous les états Phase 4.
- n8n `30-wordpress-review` (ID `WPREVIEW4Phase0001`), `35-wordpress-correction-loop` (ID `WPCORRECT4Phase0001`), `40-wordpress-publish` (ID `WPPUBLISH4Phase0001`) — **importés dans n8n mais INACTIFS**, à activer manuellement dans l'UI (voir raison ci-dessous).
- Checksum recalculé à chaque passage de `30-wordpress-review` à partir du manifest courant → toute correction (Phase 35 fusionne les entrées corrigées dans le manifest) invalide automatiquement une approbation qui référencerait l'ancien checksum, sans étape de révocation séparée.
- Boucle de correction plafonnée à 3 tentatives (codé en dur dans le node "IF Attempts Exceeded" de `35-wordpress-correction-loop`) ; au-delà, transition directe vers `failed` avec les findings non résolus dans la raison — c'est l'escalade humaine v1 (pas de canal de notification réel, cf point 9 plus bas).
- Adapter de production v1 = stub `staging-passthrough` documenté et remplaçable (contrat d'entrée/sortie précisé dans `automation/README.md`), conformément à la décision du plan ("Version 1 stops at an abstract production adapter").
- Smoke checks post-publication : disponibilité + nombre de pages + relecture manifest, réellement fonctionnels. `navigation_path`, `form_submission_path`, `indexing_state`, `visual_regression` sont explicitement documentés comme non automatisés en v1 (pas d'outil navigateur/crawler dans le pipeline).
- `automation/README.md` créé — documente credentials, machine à états, chaînage manuel, timeouts/retries, recovery manuelle, contrat de remplacement de l'adapter, rétention/redaction des preuves.
- **RIEN DE TOUT ÇA N'A ÉTÉ TESTÉ EN DIRECT** (aucune exécution réelle des webhooks `wordpress-review`/`wordpress-correction`/`wordpress-publish`) — décision explicite de l'utilisateur de committer/pousser sans passer par un cycle de test avant de documenter la Phase 4. **C'est la toute première chose à faire à la prochaine session : activer les 3 workflows dans l'UI n8n, puis rejouer un cycle complet 1→2→3→4 avec un `request_id` neuf.**
- Import CLI d'un workflow `zz-import-smoke-test` (test de mécanique d'import, `noOp` inoffensif, inactif) laissé dans n8n — à supprimer manuellement via l'UI, la CLI n8n n'a pas de commande `delete:workflow` et l'accès direct à postgres a été refusé par le classifieur de sécurité (à raison, il aurait fallu manipuler la clé de chiffrement des credentials pour un accès équivalent).

## État exact du staging au moment de la pause

- `wp-staging` : 2 pages WordPress par défaut seulement (Sample Page, Privacy Policy) — les pages de test ont été nettoyées.
- Un menu **"Menu principal" existe déjà** (term_id 4, assigné à l'emplacement `primary`) — créé par un run Phase 2 précédent.
- La requête de test `phase3-e2e-003` est en état **`failed`** : son run Phase 2 a échoué sur `create_menu` car "Menu principal" existe déjà (`wp menu create` n'est pas idempotent nativement — limitation connue, pas un bug du pipeline). À supprimer (`DELETE /requests/phase3-e2e-003`) avant de rejouer un test, ou repartir avec un nouveau `request_id`.

## Ce qui reste à faire

1. **Activer et tester la Phase 4** (priorité immédiate) — activer `30-wordpress-review`, `35-wordpress-correction-loop`, `40-wordpress-publish` dans l'UI n8n (importés inactifs), puis rejouer un cycle complet neuf : intake → approve → infra → builder → review → (correction si besoin) → publish-approve → publish. Vérifier en particulier : le checksum change bien après une correction, une approbation à l'ancien checksum est bien rejetée (409), les smoke checks post-publish passent.
2. **Nettoyer `zz-import-smoke-test`** dans l'UI n8n (workflow de test inoffensif laissé par erreur, voir Phase 4 ci-dessus).
3. **Idempotence de `create_menu`** — ajouter une vérification d'existence avant création (soit dans le prompt de l'agent en lui donnant un outil de lecture, soit dans l'allow-list/runner) pour respecter la tâche 2 de la Phase 2 du plan ("safe to retry").
4. **Chaînage automatique Phase 1 → 2 → 3 → 4** — actuellement déclenché manuellement (curl séparés, un de plus depuis la Phase 4). Le plan (tâche 4, Phase 1) demande que l'approbation déclenche automatiquement la suite. Nécessite un mécanisme asynchrone (l'exécution complète prend 100s+, trop long pour bloquer la réponse HTTP de l'approbateur).
5. **Revue des prompts des agents IA** — les prompts actuels (Phase 2/3/4) sont volontairement minimaux, écrits pour prouver la mécanique du pipeline, pas la qualité du contenu ou de la revue. Maintenant que la Phase 4 existe, un vrai cycle de test donnera un signal concret sur leur qualité.
6. **QA navigateur réelle** — `navigation_path`, `form_submission_path`, `indexing_state`, `visual_regression` ne sont pas automatisés (aucun outil navigateur/crawler dans le pipeline). Itération future si le besoin se confirme.
7. **Adapter de production réel** — le stub `staging-passthrough` (Phase 4) doit être remplacé une fois l'hébergement cible connu (voir contrat dans `automation/README.md`).
8. **Moteur `claude`** — session OAuth expirée dans le conteneur bridge (`Failed to authenticate: OAuth session expired`). Tous les agents utilisent `codex` en attendant. Si `claude` est voulu, il faut se reconnecter localement puis rafraîchir le fichier seedé dans le bridge.
9. **Mémoire n8n** — le conteneur `n8n` a redémarré seul de très nombreuses fois pendant la session, y compris pendant les imports Phase 4 (`mem_limit: 600m` dans `n8n/docker-compose.yml`, usage de base déjà ~60-80% juste au démarrage ; `publish:workflow` en CLI l'a fait OOM-kill). Recommandé : monter à 1-1.5GB avant toute activation/test Phase 4 en masse.
10. **SMTP** — credential `SMTP account` créé dans n8n mais jamais câblé à un node. Pourrait servir d'alerte réelle pour l'escalade de la boucle de correction (point 5 de la Phase 4) ou pour le Core Pipeline V1 (désormais obsolète).

## Identifiants et emplacements (valeurs non répétées ici pour rester public-repo-safe)

| Élément | Où le trouver |
| --- | --- |
| Token webhook Phase 1/2/3 (`X-Intake-Token`) | credential n8n **Site Build Intake Token** (id `TINskEJG2pAFYwcv`) |
| Token interne bridge (`X-Bridge-Token`) | credential n8n **Header Auth account** (id `32Y7qJF1EaigIR6t`) ; valeur dans `/srv/config/mcp-n8n-wp-builder/.env` |
| Token MCP staging | credential n8n **WP Staging MCP Token** (id `Yo9eorpphgq9v3VJ`) ; option WP `wp_mcp_bearer_token` (hashé) sur `wp-staging` |
| Clé SSH staging | `/srv/config/wp-staging/ssh_keys/wpcli_staging_key` (hôte), montée `:ro` dans le bridge |
| IDs workflows n8n | `00-site-build-intake` = `VEKYSDpw3JPWvHh8` · `10-wordpress-infrastructure` = `WPINFRA2Phase0001` · `20-wordpress-builder` = `WPBUILD3Phase0001` · `30-wordpress-review` = `WPREVIEW4Phase0001` (inactif) · `35-wordpress-correction-loop` = `WPCORRECT4Phase0001` (inactif) · `40-wordpress-publish` = `WPPUBLISH4Phase0001` (inactif) |

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

# 4. Phase 4 (workflows a activer dans l'UI n8n avant tout ceci) : review, puis
#    approbation de publication avec le checksum retourné par la review.
curl -X POST https://n8n.varascundo.com/webhook/wordpress-review -H "X-Intake-Token: ..." -d '{"request_id":"..."}'
curl https://wp-builder.varascundo.com/requests/<request_id> | jq '.contract.stage_artifacts.build_checksum, .contract.stage_artifacts.review_result.verdict'
curl -X POST https://n8n.varascundo.com/webhook/wordpress-publish -H "X-Intake-Token: ..." \
  -d '{"request_id":"...","actor":"human-reviewer","build_checksum":"<from above>","target_environment":"staging-passthrough","expiry":"2026-08-25T00:00:00Z"}'
```
