/**
 * Feedback Queue Management
 * Handles queuing and retry logic for failed feedback submissions
 */

import type { QueuedFeedback, FeedbackRequest } from '@/types';
import { sendFeedback } from '@/services/feedback';

const QUEUE_STORAGE_KEY = 'feedbackQueue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 3;
const QUEUE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface QueueData {
  queue: QueuedFeedback[];
  lastProcessedAt: number;
}

/**
 * Adds a failed feedback item to the queue
 * @param couponId - UUID of the coupon
 * @param feedback - Feedback data
 */
export async function addToQueue(couponId: string, feedback: FeedbackRequest): Promise<void> {
  try {
    const queueData = await getQueueData();
    const now = Date.now();

    // Check if this coupon is already in queue
    const existingIndex = queueData.queue.findIndex((item) => item.couponId === couponId);

    if (existingIndex >= 0) {
      // Update existing item
      queueData.queue[existingIndex] = {
        ...queueData.queue[existingIndex],
        feedback,
        attempts: queueData.queue[existingIndex].attempts + 1,
        lastAttemptAt: now,
      };
    } else {
      // Add new item
      const newItem: QueuedFeedback = {
        couponId,
        feedback,
        attempts: 0,
        createdAt: now,
      };

      queueData.queue.push(newItem);
    }

    // Enforce max queue size (FIFO eviction)
    if (queueData.queue.length > MAX_QUEUE_SIZE) {
      queueData.queue = queueData.queue.slice(-MAX_QUEUE_SIZE);
    }

    await saveQueueData(queueData);
  } catch (error) {
    console.error('Error adding feedback to queue:', error);
  }
}

/**
 * Retrieves all queued feedback items
 * @returns Array of queued feedback items
 */
export async function getQueue(): Promise<QueuedFeedback[]> {
  const queueData = await getQueueData();
  return queueData.queue;
}

/**
 * Removes a feedback item from the queue
 * @param couponId - UUID of the coupon to remove
 */
export async function removeFromQueue(couponId: string): Promise<void> {
  try {
    const queueData = await getQueueData();
    queueData.queue = queueData.queue.filter((item) => item.couponId !== couponId);
    await saveQueueData(queueData);
  } catch (error) {
    console.error('Error removing feedback from queue:', error);
  }
}

/**
 * Cleans up expired and max-attempt items from the queue
 * @returns Number of items removed
 */
export async function cleanupQueue(): Promise<number> {
  try {
    const queueData = await getQueueData();
    const now = Date.now();
    const initialLength = queueData.queue.length;

    queueData.queue = queueData.queue.filter((item) => {
      // Remove if too old
      if (now - item.createdAt > QUEUE_EXPIRY_MS) {
        console.debug(`Removing expired feedback for coupon ${item.couponId}`);
        return false;
      }

      // Remove if max attempts reached
      if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        console.debug(`Removing max-attempt feedback for coupon ${item.couponId}`);
        return false;
      }

      return true;
    });

    const removedCount = initialLength - queueData.queue.length;

    if (removedCount > 0) {
      await saveQueueData(queueData);
    }

    return removedCount;
  } catch (error) {
    console.error('Error cleaning up feedback queue:', error);
    return 0;
  }
}

/**
 * Processes the entire queue, attempting to send all queued feedback
 * @returns Object with counts of successful, failed, and skipped items
 */
const MAX_QUEUE_PROCESS_ITEMS = 50; // Process max 50 items per run
const ITEM_TIMEOUT_MS = 15000; // 15 seconds per item

export async function processQueue(maxItems: number = MAX_QUEUE_PROCESS_ITEMS): Promise<{
  successful: number;
  failed: number;
  skipped: number;
}> {
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Clean up expired items first
    await cleanupQueue();

    const queueData = await getQueueData();
    const now = Date.now();

    // Limit number of items to process
    const itemsToProcess = queueData.queue.slice(0, maxItems);

    // Process each item
    for (const item of itemsToProcess) {
      // Skip if max attempts reached
      if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        results.skipped++;
        continue;
      }

      // Attempt to send feedback with timeout
      try {
        const response = await Promise.race([
          sendFeedback(item.couponId, item.feedback),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ITEM_TIMEOUT_MS)),
        ]);

        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response');
        }

        const feedbackResponse = response as { success: boolean };

        if (feedbackResponse.success) {
          // Success - remove from queue
          await removeFromQueue(item.couponId);
          results.successful++;
          console.debug(`Successfully processed queued feedback for coupon ${item.couponId}`);
        } else {
          // Failed - increment attempt count
          const updatedItem = {
            ...item,
            attempts: item.attempts + 1,
            lastAttemptAt: now,
          };

          // If 404, coupon was deleted - remove from queue
          const errorResponse = response as { success: boolean; code?: string };
          if (errorResponse.code === 'COUPON_NOT_FOUND') {
            await removeFromQueue(item.couponId);
            results.skipped++;
            console.debug(`Removing queued feedback for deleted coupon ${item.couponId}`);
          } else if (updatedItem.attempts >= MAX_RETRY_ATTEMPTS) {
            // Max attempts reached - remove from queue
            await removeFromQueue(item.couponId);
            results.failed++;
            console.warn(`Max retry attempts reached for coupon ${item.couponId}`);
          } else {
            // Update queue with new attempt count
            const updatedQueue = queueData.queue.map((q) => (q.couponId === item.couponId ? updatedItem : q));
            await saveQueueData({ ...queueData, queue: updatedQueue });
            results.failed++;
          }
        }
      } catch (error) {
        // Timeout or error - increment attempt count
        console.warn('[Queue] Failed to process item:', error);
        const updatedItem = {
          ...item,
          attempts: item.attempts + 1,
          lastAttemptAt: now,
        };

        if (updatedItem.attempts >= MAX_RETRY_ATTEMPTS) {
          await removeFromQueue(item.couponId);
          results.failed++;
        } else {
          const updatedQueue = queueData.queue.map((q) => (q.couponId === item.couponId ? updatedItem : q));
          await saveQueueData({ ...queueData, queue: updatedQueue });
          results.failed++;
        }
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update last processed timestamp
    queueData.lastProcessedAt = now;
    await saveQueueData(queueData);

    console.debug(`Queue processing complete:`, results);
  } catch (error) {
    console.error('Error processing feedback queue:', error);
  }

  return results;
}

/**
 * Gets the current queue size
 * @returns Number of items in the queue
 */
export async function getQueueSize(): Promise<number> {
  const queueData = await getQueueData();
  return queueData.queue.length;
}

/**
 * Clears the entire queue
 */
export async function clearQueue(): Promise<void> {
  try {
    await chrome.storage.local.remove(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing feedback queue:', error);
  }
}

/**
 * Gets queue data from storage
 */
async function getQueueData(): Promise<QueueData> {
  try {
    const result = await chrome.storage.local.get(QUEUE_STORAGE_KEY);
    return (result[QUEUE_STORAGE_KEY] as QueueData | undefined) || { queue: [], lastProcessedAt: 0 };
  } catch (error) {
    console.error('Error reading queue data:', error);
    return { queue: [], lastProcessedAt: 0 };
  }
}

/**
 * Saves queue data to storage
 */
async function saveQueueData(queueData: QueueData): Promise<void> {
  try {
    await chrome.storage.local.set({ [QUEUE_STORAGE_KEY]: queueData });
  } catch (error) {
    console.error('Error saving queue data:', error);
  }
}
