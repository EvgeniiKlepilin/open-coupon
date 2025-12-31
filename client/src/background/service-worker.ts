/**
 * Background Service Worker
 * Handles periodic queue processing and extension lifecycle events
 */

import { processQueue, cleanupQueue } from '@/utils/feedbackQueue';

/**
 * Sets up alarm for periodic queue processing
 */
function setupQueueProcessingAlarm(): void {
  chrome.alarms.create('processFeedbackQueue', {
    periodInMinutes: 5,
  });
}

/**
 * Processes the feedback queue
 */
async function processFeedbackQueue(): Promise<void> {
  console.debug('[Background] Processing feedback queue...');
  const results = await processQueue();
  console.debug('[Background] Queue processing results:', results);
}

/**
 * Handles extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.debug('[Background] Extension installed/updated:', details.reason);

  // Set up periodic queue processing
  setupQueueProcessingAlarm();

  // Process queue immediately on install
  if (details.reason === 'install') {
    console.debug('[Background] First install - processing queue');
    processFeedbackQueue();
  }
});

/**
 * Handles extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.debug('[Background] Extension started');

  // Set up periodic queue processing
  setupQueueProcessingAlarm();

  // Process queue on startup to handle any failed requests from previous session
  processFeedbackQueue();

  // Clean up expired items
  cleanupQueue();
});

/**
 * Handles alarm events
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'processFeedbackQueue') {
    processFeedbackQueue();
  }
});

/**
 * Handles messages from content scripts or popup
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PROCESS_FEEDBACK_QUEUE') {
    // Allow manual queue processing trigger
    processFeedbackQueue().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_QUEUE_STATUS') {
    // Return queue status
    chrome.storage.local.get('feedbackQueue').then((result) => {
      const queueData = (result.feedbackQueue as { queue: unknown[]; lastProcessedAt: number } | undefined) || { queue: [], lastProcessedAt: 0 };
      sendResponse({
        queueSize: queueData.queue.length,
        lastProcessedAt: queueData.lastProcessedAt,
      });
    });
    return true;
  }
});

console.debug('[Background] Service worker initialized');
