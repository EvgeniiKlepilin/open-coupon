import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { findCouponElements } from './detector';
import { autoApplyCoupons } from './applier';
import AutoApplyOverlay from './components/AutoApplyOverlay';
import AutoApplyResult from './components/AutoApplyResult';
import type { Coupon, ApplierResult, CouponTestResult } from '@/types';

/**
 * AutoApplyManager
 *
 * Manages the auto-apply coupon testing flow:
 * - Listens for messages from popup
 * - Detects coupon input fields
 * - Runs auto-apply with progress UI
 * - Shows results to user
 */
export default class AutoApplyManager {
  private overlayContainer: HTMLDivElement | null = null;
  private resultContainer: HTMLDivElement | null = null;
  private overlayRoot: any = null;
  private resultRoot: any = null;
  private isRunning = false;
  private currentAbortController: AbortController | null = null;

  // State for overlay
  private currentCoupon = '';
  private currentIndex = 0;
  private totalCoupons = 0;
  private bestDiscount = 0;


  init(): void {
    // Create overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'opencoupon-overlay-container';
    document.body.appendChild(this.overlayContainer);
    this.overlayRoot = createRoot(this.overlayContainer);

    // Create result container
    this.resultContainer = document.createElement('div');
    this.resultContainer.id = 'opencoupon-result-container';
    document.body.appendChild(this.resultContainer);
    this.resultRoot = createRoot(this.resultContainer);

    // Initial render (hidden)
    this.renderOverlay(false);
    this.renderResult(null);

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'AUTO_APPLY_COUPONS') {
        this.handleAutoApply(message.coupons)
          .then((result) => {
            sendResponse({ success: true, result });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep channel open for async response
      }

      if (message.type === 'CANCEL_AUTO_APPLY') {
        this.handleCancel();
        sendResponse({ success: true });
        return true;
      }
    });

    console.log('[OpenCoupon] AutoApplyManager initialized');
  }

  private async handleAutoApply(coupons: Coupon[]): Promise<ApplierResult> {
    if (this.isRunning) {
      throw new Error('Auto-apply is already running');
    }

    console.log('[OpenCoupon] Starting auto-apply with', coupons.length, 'coupons');

    try {
      this.isRunning = true;
      this.currentAbortController = new AbortController();

      // Reset state
      this.currentCoupon = '';
      this.currentIndex = 0;
      this.totalCoupons = coupons.length;
      this.bestDiscount = 0;

      // Show overlay
      this.renderOverlay(true);

      // Step 1: Detect coupon input fields
      console.log('[OpenCoupon] Detecting coupon fields...');
      const detection = await findCouponElements();

      if (!detection.inputElement || !detection.submitElement) {
        const errorResult: ApplierResult = {
          tested: 0,
          successful: 0,
          failed: 0,
          bestCoupon: null,
          allResults: [],
          cancelledByUser: false,
          errorMessage: 'Could not find coupon input field on this page',
        };
        this.showResult(errorResult);
        return errorResult;
      }

      console.log(
        '[OpenCoupon] Coupon field detected with',
        detection.confidence,
        'confidence via',
        detection.detectionMethod
      );

      // Step 2: Run auto-apply
      const result = await autoApplyCoupons({
        coupons,
        inputElement: detection.inputElement,
        submitElement: detection.submitElement,
        maxAttempts: 20,
        timeout: 5000,
        onProgress: (current, total, code) => {
          console.log(`[OpenCoupon] Testing ${code} (${current}/${total})`);
          this.currentCoupon = code;
          this.currentIndex = current;
          this.totalCoupons = total;
          this.renderOverlay(true);
        },
        onCouponTested: (testResult: CouponTestResult) => {
          console.log(
            `[OpenCoupon] ${testResult.success ? '✅' : '❌'} ${testResult.code}:`,
            testResult.success
              ? `Saved $${testResult.discountAmount.toFixed(2)}`
              : testResult.failureReason
          );

          // Update best discount
          if (testResult.success && testResult.discountAmount > this.bestDiscount) {
            this.bestDiscount = testResult.discountAmount;
            this.renderOverlay(true);
          }
        },
        onComplete: (finalResult: ApplierResult) => {
          console.log('[OpenCoupon] Auto-apply complete:', finalResult);
        },
      });

      // Step 3: Show result
      this.showResult(result);

      return result;
    } catch (error) {
      console.error('[OpenCoupon] Auto-apply failed:', error);

      const errorResult: ApplierResult = {
        tested: 0,
        successful: 0,
        failed: 0,
        bestCoupon: null,
        allResults: [],
        cancelledByUser: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      this.showResult(errorResult);
      return errorResult;
    } finally {
      this.isRunning = false;
      this.currentAbortController = null;
      this.renderOverlay(false);
    }
  }

  private handleCancel(): void {
    console.log('[OpenCoupon] Auto-apply cancelled by user');
    this.currentAbortController?.abort();
    this.isRunning = false;
    this.renderOverlay(false);
  }

  private showResult(result: ApplierResult): void {
    this.renderResult(result);
  }

  private renderOverlay(isActive: boolean): void {
    if (!this.overlayRoot) return;

    this.overlayRoot.render(
      <StrictMode>
        <AutoApplyOverlay
          isActive={isActive}
          currentCoupon={this.currentCoupon}
          currentIndex={this.currentIndex}
          totalCoupons={this.totalCoupons}
          bestDiscount={this.bestDiscount}
          onCancel={() => this.handleCancel()}
        />
      </StrictMode>
    );
  }

  private renderResult(result: ApplierResult | null): void {
    if (!this.resultRoot) return;

    this.resultRoot.render(
      <StrictMode>
        <AutoApplyResult
          result={result}
          onClose={() => {
            this.renderResult(null);
          }}
        />
      </StrictMode>
    );
  }
}
