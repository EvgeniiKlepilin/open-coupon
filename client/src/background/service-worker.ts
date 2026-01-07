/**
 * Background Service Worker
 * Handles periodic queue processing and extension lifecycle events
 */

import { processQueue, cleanupQueue } from '@/utils/feedbackQueue';
import { isValidMessageSender, isValidMessageStructure } from '@/utils/security';

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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Security: Validate sender is from our extension
  if (!isValidMessageSender(sender)) {
    sendResponse({ success: false, error: 'Unauthorized sender' });
    return true;
  }

  // Security: Validate message structure
  if (!isValidMessageStructure(message)) {
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }

  if (message.type === 'PROCESS_FEEDBACK_QUEUE') {
    // Allow manual queue processing trigger
    processFeedbackQueue()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Background] Queue processing failed:', error);
        sendResponse({ success: false, error: 'Queue processing failed' });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_QUEUE_STATUS') {
    // Return queue status
    chrome.storage.local
      .get('feedbackQueue')
      .then((result) => {
        const queueData = (result.feedbackQueue as { queue: unknown[]; lastProcessedAt: number } | undefined) || {
          queue: [],
          lastProcessedAt: 0,
        };
        sendResponse({
          success: true,
          queueSize: queueData.queue.length,
          lastProcessedAt: queueData.lastProcessedAt,
        });
      })
      .catch((error) => {
        console.error('[Background] Failed to get queue status:', error);
        sendResponse({ success: false, error: 'Failed to get queue status' });
      });
    return true;
  }

  // Unknown message type
  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

console.debug('[Background] Service worker initialized');
