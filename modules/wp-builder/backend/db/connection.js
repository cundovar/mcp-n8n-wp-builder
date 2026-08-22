import mongoose from 'mongoose';

// Instance mongoose distincte de bridge/src/db/connection.js : deux npm ci
// séparés (bridge/ et modules/wp-builder/ ont chacun leur propre
// node_modules/mongoose, imposé par le Dockerfile — voir son commentaire).
// mongoose garde son état de connexion sur l'instance du module, donc
// connecter celle du bridge ne connecte PAS celle-ci : sans cet appel,
// toute requête des modèles wp-builder (Request, RequestArtifact, ...)
// reste bufferisée jusqu'au timeout (MongooseError: buffering timed out).
let isConnected = false;

export async function connectDB(uri) {
  if (isConnected) return;
  await mongoose.connect(uri);
  isConnected = true;
}
