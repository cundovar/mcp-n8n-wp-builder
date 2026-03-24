# WP Site Builder — Core Pipeline

## Vue d'ensemble

Le workflow `WP Site Builder — Core Pipeline` orchestre la génération d'un plan de site WordPress puis d'un script bash à partir d'un brief utilisateur.

Le système repose sur 3 briques :

- `n8n` pour l'orchestration
- `bridge` pour exposer une API HTTP locale et stocker les demandes
- `bridge/frontend` pour créer les demandes, suivre leur état et valider les briefs

Objectif global :

1. recevoir un brief de site WordPress
2. faire analyser le brief par un agent collecteur
3. transformer le résultat en architecture de site
4. demander une validation humaine
5. reprendre le workflow après validation
6. produire un script bash WordPress
7. renvoyer le résultat final au bridge

## Composants

- Workflow n8n : `WP Site Builder — Core Pipeline`
- Workflow ID : `C7UfaSAxGUA26nMo`
- Backend bridge : [requests.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/routes/requests.js)
- Modèle Mongo : [Request.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/db/models/Request.js)
- Config bridge : [default.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/config/default.js)
- Frontend principal : [App.jsx](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend/src/App.jsx)
- Vue détail : [RequestDetail.jsx](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend/src/components/RequestDetail.jsx)
- Liste et validations : [RequestList.jsx](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend/src/components/RequestList.jsx)

## Configuration

Exemple de variables utiles côté bridge :

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/wp-site-builder-core-brief
MONGODB_URI=mongodb://localhost:27017/wp-builder
BRIDGE_PUBLIC_BASE_URL=http://192.168.1.147:3000
```

`BRIDGE_PUBLIC_BASE_URL` est essentiel :

- il sert à construire le `callback_url` envoyé à n8n
- il doit être joignable depuis n8n
- dans cette installation, la valeur cohérente est `http://192.168.1.147:3000`

## Modèle de données

Une demande stockée dans Mongo contient principalement :

- `requestId`
- `status`
- `input`
- `result`
- `validation`
- timestamps

Statuts utilisés :

- `pending`
- `processing`
- `waiting_validation`
- `completed`
- `failed`

Bloc `validation` :

- `requested_at`
- `approved_at`
- `resume_url`
- `brief_architecte`
- `project_name`
- `project_description`

## Endpoints du bridge

### `POST /requests`

Crée une demande et déclenche le webhook n8n.

### `GET /requests`

Retourne la liste des demandes.

### `GET /requests/:id`

Retourne le détail d'une demande.

### `POST /requests/:id/validation-request`

Appelé par n8n pour enregistrer qu'une validation humaine est requise.

### `POST /requests/:id/approve`

Appelé par le frontend pour reprendre le `Wait` n8n.

### `POST /requests/:id/callback`

Appelé par n8n en fin de workflow pour stocker le résultat final.

## Flux fonctionnel

1. Le frontend envoie `POST /requests`.
2. Le bridge crée la demande en base.
3. Le bridge déclenche le webhook n8n `wp-site-builder-core-brief`.
4. n8n appelle `Agent 1 — Collecteur`.
5. n8n appelle `Agent 2 — Architecte`.
6. n8n prépare le `brief_architecte`.
7. n8n appelle `Bridge — Validation Request`.
8. Le bridge passe la demande en `waiting_validation`.
9. Le frontend affiche la demande dans l'onglet `Validations`.
10. L'utilisateur clique `Valider et continuer`.
11. Le bridge appelle l'URL de reprise du `Wait`.
12. n8n reprend l'exécution.
13. n8n appelle `Agent 3 — Builder`.
14. `Save Script to File` extrait le `bash_script`.
15. `Callback — Result` renvoie le résultat au bridge.
16. Le bridge passe la demande en `completed`.

## Nœuds n8n

### `Brief Client Webhook`

Point d'entrée HTTP du workflow.

Rôle :

- recevoir le brief initial
- transporter `requestId`
- transporter le `callback_url`

### `Agent 1 — Collecteur`

Appelle le bridge local sur `/task`.

Rôle :

- analyser le brief brut
- produire un JSON structuré sur les besoins, objectifs, contraintes et signaux utiles

### `Agent 2 — Architecte`

Appelle également le bridge local sur `/task`.

Rôle :

- transformer le résultat collecteur en architecture de site
- retourner un JSON compatible avec le schéma attendu :
  - `site_name`
  - `site_type`
  - `pages`
  - `design_direction`
  - `technical_notes`

### `Préparer validation`

Rôle :

- convertir le JSON architecte en `brief_architecte`
- préparer les données affichées dans la validation frontend

### `Bridge — Validation Request`

Appelle le bridge sur `/requests/:id/validation-request`.

Rôle :

- enregistrer la validation en attente
- transmettre :
  - `requestId`
  - `resume_url`
  - `brief_architecte`
  - `project_name`
  - `project_description`

### `Attente Validation`

Nœud `Wait` n8n.

Rôle :

- suspendre le workflow
- reprendre après validation via un webhook

Configuration importante :

- reprise par webhook
- suffixe : `wp-site-builder-core-validation`
- méthode de reprise : `GET`

### `Agent 3 — Builder`

Appelle le bridge sur `/task`.

Rôle :

- transformer l'architecture validée en JSON technique
- produire notamment `bash_script`

### `Save Script to File`

Nœud `Code`.

Rôle :

- parser `stdout`
- extraire `bash_script`
- générer un nom de fichier horodaté

### `Callback — Result`

Appelle le bridge sur `/requests/:id/callback`.

Rôle :

- envoyer le résultat final au bridge
- transmettre :
  - `requestId`
  - `success`
  - `bash_script`

Important :

- ce nœud n'utilise plus de `jsonBody` interpolé fragile
- il envoie désormais des paramètres structurés

### `Notification — Fin`

Nœud d'email de fin.

Rôle :

- notifier la fin du pipeline

Ce nœud reste secondaire par rapport au flux bridge/frontend.

## Validation frontend

Le frontend expose :

- un onglet `Validations`
- un compteur de validations en attente
- une vue détail avec :
  - le `brief_architecte`
  - un bouton `Valider et continuer`

Comportement :

- une demande en `waiting_validation` apparaît dans la vue dédiée
- le clic sur validation appelle `POST /requests/:id/approve`
- le bridge reconstruit l'URL de reprise n8n
- la reprise utilise :
  - `GET`
  - le suffixe `wp-site-builder-core-validation`

## Correctifs déjà appliqués

Les points suivants ont été corrigés dans cette version :

- `Agent 2 — Architecte` n'utilise plus un `jsonBody` fragile
- `context` est envoyé comme objet et non comme string JSON
- `Callback — Result` n'utilise plus un JSON cassé par interpolation du script bash
- la reprise du `Wait` utilise `GET`
- l'URL de reprise ajoute bien le suffixe du webhook d'attente
- le `callback_url` ne repose plus sur `0.0.0.0`
- le frontend expose maintenant une vraie vue `Validations`

## Procédure d'utilisation

### Démarrer le bridge

```bash
cd /home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge
npm run dev
```

Ou sans watch :

```bash
cd /home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge
npm start
```

### Démarrer le frontend

```bash
cd /home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend
npm run dev -- --host 0.0.0.0
```

### Utilisation

1. ouvrir `http://localhost:5173`
2. créer une nouvelle demande
3. aller dans l'onglet `Validations`
4. ouvrir la demande concernée
5. cliquer `Valider et continuer`
6. attendre le résultat final

## Dépannage

### Si la validation échoue

Vérifier :

- `BRIDGE_PUBLIC_BASE_URL`
- que n8n peut joindre `192.168.1.147:3000`
- que le bridge réel a bien été redémarré
- que la demande testée est nouvelle

### Si n8n échoue après validation

Lire l'exécution n8n et identifier le nœud en erreur :

- `Agent 3 — Builder`
- `Save Script to File`
- `Callback — Result`
- `Notification — Fin`

### Si le frontend ne montre pas les changements

Vérifier :

- que le frontend Vite actif est le bon
- que la page a été rechargée complètement
- que le bridge sur `localhost:3000` est bien celui redémarré avec les derniers patches

## Limites actuelles

Le workflow reste basique.

Principales limites :

- prompts longs et peu normalisés
- absence de validation stricte de schéma entre les étapes
- traçabilité métier limitée entre collecteur, architecte et builder
- un seul builder final
- pas de reprise partielle intelligente
- pas de versionnement métier des artefacts
- script bash final encore générique

## Évolutions recommandées

Pour une v2 plus solide :

1. définir un schéma JSON strict à chaque étape
2. stocker les artefacts intermédiaires côté bridge
3. ajouter des statuts de pipeline par phase
4. séparer architecture, contenu, design et exécution
5. décomposer le builder en étapes techniques plus fines
6. améliorer la gestion d'erreurs et de retries
7. ajouter une observabilité plus détaillée par exécution

## Résumé

Le workflow actuel fonctionne ainsi :

- brief entrant
- collecte
- architecture
- validation humaine
- reprise
- génération de script
- callback bridge
- affichage du résultat

Il est désormais opérationnel, mais reste une base de travail qu'il faudra structurer davantage pour passer à une version plus robuste.
