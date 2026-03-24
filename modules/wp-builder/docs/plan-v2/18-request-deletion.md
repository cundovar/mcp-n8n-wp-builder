# Suppression Des Demandes

Cette doc décrit comment ajouter une suppression de demande propre dans le frontend et dans la base, en tenant compte de la V1, de la V2, des artefacts, des décisions de validation et des exécutions.

Le besoin est double :

- supprimer une demande depuis l'interface
- supprimer aussi ses données en base

Aujourd'hui, le backend a déjà une route minimale :

- `DELETE /requests/:id`

Mais cette route ne supprime actuellement que le document `Request`.

Elle ne nettoie pas encore :

- `RequestArtifact`
- `ValidationDecision`
- `RequestExecution`

Donc la suppression existe, mais elle n'est pas encore complète.

## MongoDB Utilisée Ici

### URI Mongo configurée dans ce projet

Dans [`.env`](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/.env), l'URL Mongo configurée est :

```env
MONGODB_URI=mongodb://localhost:27017/wp-builder
```

Dans [default.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/config/default.js), c'est aussi la valeur de fallback :

```js
mongodb: {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wp-builder',
}
```

Donc ici, la base utilisée est :

- hôte : `localhost`
- port : `27017`
- base : `wp-builder`

### Réponse courte à ta question

Le lien MongoDB ici est :

```text
mongodb://localhost:27017/wp-builder
```

## État Actuel Du Backend

La route existante est dans [requests.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/routes/requests.js) :

```js
fastify.delete('/requests/:id', async (request, reply) => {
  const { id } = request.params;

  const result = await Request.deleteOne({ requestId: id });

  if (result.deletedCount === 0) {
    return reply.code(404).send({ error: 'Request not found' });
  }

  return { message: 'Request deleted', requestId: id };
});
```

Cette implémentation est insuffisante pour la V2.

## Comportement Cible

Quand un utilisateur supprime une demande depuis le frontend :

1. le frontend demande confirmation
2. le backend supprime la demande
3. le backend supprime aussi les données associées
4. la liste frontend se rafraîchit
5. si l'utilisateur était dans le détail, il revient à la liste

## Ce Qui Doit Être Supprimé

### Suppression minimale

Obligatoire :

- `Request`

### Suppression complète V2

Fortement recommandée :

- `Request`
- `RequestArtifact`
- `ValidationDecision`
- `RequestExecution`

### Pourquoi

Si on supprime seulement `Request`, on laisse des orphelins :

- artefacts encore présents
- décisions encore présentes
- exécutions encore présentes

Ce n'est pas propre.

## Stratégie Recommandée

### Option A. Suppression simple

Supprimer seulement `Request`.

Avantage :

- facile

Inconvénient :

- laisse des données orphelines

### Option B. Suppression en cascade

Supprimer :

- `Request`
- `RequestArtifact`
- `ValidationDecision`
- `RequestExecution`

Avantage :

- cohérent
- propre pour la V2

Inconvénient :

- il faut modifier le backend

### Recommandation

Pour ce projet, il faut implémenter **la suppression en cascade**.

## Backend À Modifier

### Fichiers concernés

- [requests.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/routes/requests.js)
- [RequestArtifact.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/db/models/RequestArtifact.js)
- [ValidationDecision.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/db/models/ValidationDecision.js)
- [RequestExecution.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/db/models/RequestExecution.js)

### Nouvelle logique backend

La route `DELETE /requests/:id` doit :

1. vérifier que la request existe
2. supprimer les artefacts liés
3. supprimer les décisions liées
4. supprimer les exécutions liées
5. supprimer la request
6. retourner un résumé de suppression

### Réponse JSON recommandée

```json
{
  "ok": true,
  "requestId": "req-123",
  "deleted": {
    "request": 1,
    "artifacts": 7,
    "validation_decisions": 3,
    "executions": 1
  }
}
```

## Implémentation Backend Recommandée

### Imports à ajouter

Dans [requests.js](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/src/routes/requests.js), importer :

```js
import RequestArtifact from '../db/models/RequestArtifact.js';
import ValidationDecision from '../db/models/ValidationDecision.js';
import RequestExecution from '../db/models/RequestExecution.js';
```

### Nouvelle implémentation de la route

Exemple cible :

```js
fastify.delete('/requests/:id', async (request, reply) => {
  const { id } = request.params;

  const existing = await Request.findOne({ requestId: id });
  if (!existing) {
    return reply.code(404).send({
      ok: false,
      error: 'Request not found',
      requestId: id,
    });
  }

  const [artifactsResult, decisionsResult, executionsResult, requestResult] =
    await Promise.all([
      RequestArtifact.deleteMany({ requestId: id }),
      ValidationDecision.deleteMany({ requestId: id }),
      RequestExecution.deleteMany({ requestId: id }),
      Request.deleteOne({ requestId: id }),
    ]);

  return {
    ok: true,
    requestId: id,
    deleted: {
      request: requestResult.deletedCount,
      artifacts: artifactsResult.deletedCount,
      validation_decisions: decisionsResult.deletedCount,
      executions: executionsResult.deletedCount,
    },
  };
});
```

## Gestion D'erreur Recommandée

Si la suppression échoue :

- retourner `500`
- inclure un message clair

Exemple :

```json
{
  "ok": false,
  "error": "Failed to delete request and related records"
}
```

## Frontend À Modifier

### Fichiers concernés

- [App.jsx](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend/src/App.jsx)
- [RequestList.jsx](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend/src/components/RequestList.jsx)
- [RequestDetail.jsx](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge/frontend/src/components/RequestDetail.jsx)

## Expérience Utilisateur Recommandée

### Dans la liste

Chaque demande doit pouvoir être supprimée rapidement.

Mais il faut éviter la suppression accidentelle.

Donc :

- ajouter une action `Supprimer`
- demander confirmation

### Dans le détail

Ajouter un bouton visible :

- `Supprimer la demande`

Puis confirmation.

### Message de confirmation

Exemple :

```text
Supprimer cette demande ?
Cette action supprimera aussi les artefacts, validations et exécutions associés.
```

## Implémentation Frontend Recommandée

### Dans `App.jsx`

Ajouter une fonction :

```js
const handleDeleteRequest = async (requestId) => {
  const confirmed = window.confirm(
    'Supprimer cette demande ? Cette action supprimera aussi les artefacts, validations et exécutions associés.'
  );

  if (!confirmed) return;

  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/requests/${requestId}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Suppression impossible');
    }

    if (selectedRequest?.requestId === requestId) {
      setSelectedRequest(null);
      setView('list');
    }

    await fetchRequests();
  } catch (error) {
    console.error('Erreur suppression:', error);
  } finally {
    setLoading(false);
  }
};
```

Puis passer cette fonction à :

- `RequestList`
- `RequestDetail`

## Option 1. Bouton dans `RequestDetail`

Ajouter un bouton simple.

Exemple :

```jsx
<button
  onClick={() => onDeleteRequest(request.requestId)}
  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
>
  Supprimer
</button>
```

## Option 2. Bouton dans `RequestList`

Deux approches possibles :

### Approche A

Clique sur la carte = voir détail  
Bouton à part = supprimer

### Approche B

Menu d'actions

Pour aller vite, l'approche A suffit.

Exemple :

```jsx
<button
  onClick={(e) => {
    e.stopPropagation();
    onDeleteRequest(request.requestId);
  }}
  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
>
  Supprimer
</button>
```

Le `stopPropagation()` est important :

- sinon le clic ouvrira aussi le détail

## États UI Recommandés

Pendant la suppression :

- désactiver le bouton
- afficher un état de chargement

Exemple :

- `Suppression...`

Après suppression :

- rafraîchir la liste
- quitter la vue détail si la demande supprimée était ouverte

## Cas Frontend À Gérer

### Cas 1. Suppression depuis la liste

Résultat attendu :

- la carte disparaît de la liste

### Cas 2. Suppression depuis le détail

Résultat attendu :

- retour automatique à la liste
- la demande n'apparaît plus

### Cas 3. Demande déjà supprimée

Si le backend retourne `404` :

- afficher une erreur douce
- rafraîchir la liste

## Cas Métier À Clarifier

### Peut-on supprimer une demande en cours ?

Deux choix possibles :

#### Choix A

Autoriser la suppression quel que soit l'état

Avantage :

- simple

Inconvénient :

- n8n peut encore avoir une exécution en cours

#### Choix B

Interdire la suppression si :

- `processing`
- `revising`
- `waiting_validation`

Avantage :

- plus sûr

Inconvénient :

- moins flexible

### Recommandation

Pour une première version :

- autoriser la suppression
- mais documenter que cela ne stoppe pas forcément une exécution n8n déjà lancée

Si tu veux être plus strict ensuite :

- interdire la suppression en `processing`
- ou exiger un état `cancelled` avant suppression

## Limite Importante

Supprimer en base ne stoppe pas automatiquement :

- un workflow n8n déjà démarré
- un processus externe éventuellement lancé

Donc si une demande est supprimée pendant qu'un workflow tourne encore :

- le workflow peut continuer à tenter d'appeler le bridge

Il faudra alors soit :

- accepter ce comportement
- soit ajouter plus tard une logique de `cancel`

Cette doc couvre seulement la suppression frontend + BDD.

## Sécurité Et Confirmation

La suppression doit rester explicite.

Ne pas :

- supprimer sur un simple clic sans confirmation

Toujours :

- demander confirmation

## Tests Recommandés

### Backend

Tester :

```bash
curl -X DELETE http://localhost:3000/requests/<REQUEST_ID>
```

Vérifier :

- suppression du document `Request`
- suppression des artefacts liés
- suppression des décisions liées
- suppression des exécutions liées

### Frontend

Tester :

- suppression depuis la liste
- suppression depuis le détail
- suppression d'une demande inexistante
- suppression avec une demande ouverte

## Critères D'Acceptation

Cette fonctionnalité est correcte si :

- l'utilisateur peut supprimer une demande depuis le frontend
- une confirmation est demandée
- la demande disparaît de la liste
- si la demande était ouverte, l'UI revient à la liste
- la `Request` est supprimée en base
- les `RequestArtifact` liés sont supprimés
- les `ValidationDecision` liées sont supprimées
- les `RequestExecution` liées sont supprimées

## Résumé Simple

Le projet a déjà :

- une route `DELETE /requests/:id`

Mais elle est incomplète.

Pour faire une vraie suppression V2, il faut :

- brancher le bouton dans le frontend
- supprimer en cascade dans Mongo

Et ici, l'URL Mongo configurée est :

```text
mongodb://localhost:27017/wp-builder
```
