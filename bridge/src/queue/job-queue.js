import fastq from 'fastq';
import config from '../../config/default.js';
import { executeTask } from '../services/executor.js';

// Worker function for the queue
async function worker(task) {
  return executeTask(task);
}

// Create the queue with concurrency limit
const queue = fastq.promise(worker, config.limits.maxConcurrentJobs);

/**
 * Add a task to the queue
 * Returns a promise that resolves with the task result
 */
export function enqueue(task) {
  return queue.push(task);
}

/**
 * Get queue statistics
 */
export function getStats() {
  return {
    concurrency: queue.concurrency,
    pending: queue.length(),
    running: queue.running(),
    idle: queue.idle(),
  };
}

/**
 * Pause the queue (no new tasks will be processed)
 */
export function pause() {
  queue.pause();
}

/**
 * Resume the queue
 */
export function resume() {
  queue.resume();
}

/**
 * Kill all pending tasks
 */
export function drain() {
  queue.killAndDrain();
}

export default queue;
