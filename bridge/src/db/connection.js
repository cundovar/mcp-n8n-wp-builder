import mongoose from 'mongoose';
import config from '../../config/default.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const mongoUri = config.mongodb.uri;

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('MongoDB connected:', mongoUri.replace(/\/\/.*@/, '//***@'));
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  };
}
