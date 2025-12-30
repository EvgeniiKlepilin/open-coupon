import { useEffect, useState } from 'react';
import type { Coupon } from '@/types';
import { fetchCouponsForDomain, getCurrentTab, extractHostname, isValidUrl } from '@/services/api';
import CouponCard from './CouponCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import logo from '@/assets/logo.png';

interface CouponListState {
  coupons: Coupon[];
  loading: boolean;
  error: Error | null;
  domain: string | null;
}

interface ToastMessage {
  show: boolean;
  message: string;
}

interface AutoApplyState {
  isRunning: boolean;
  error: string | null;
}

export default function CouponList() {
  const [state, setState] = useState<CouponListState>({
    coupons: [],
    loading: true,
    error: null,
    domain: null,
  });

  const [toast, setToast] = useState<ToastMessage>({
    show: false,
    message: '',
  });

  const [autoApplyState, setAutoApplyState] = useState<AutoApplyState>({
    isRunning: false,
    error: null,
  });

  const loadCoupons = async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const tab = await getCurrentTab();

      if (!tab?.url || !isValidUrl(tab.url)) {
        setState({
          coupons: [],
          loading: false,
          error: new Error('Invalid page. Navigate to a website to see coupons.'),
          domain: null,
        });
        return;
      }

      const hostname = extractHostname(tab.url);

      if (!hostname) {
        setState({
          coupons: [],
          loading: false,
          error: new Error('Could not extract domain from URL'),
          domain: null,
        });
        return;
      }

      const coupons = await fetchCouponsForDomain(hostname);

      // Sort by success count DESC, then by lastSuccessAt DESC
      const sortedCoupons = coupons.sort((a, b) => {
        if (b.successCount !== a.successCount) {
          return b.successCount - a.successCount;
        }

        const aTime = a.lastSuccessAt ? new Date(a.lastSuccessAt).getTime() : 0;
        const bTime = b.lastSuccessAt ? new Date(b.lastSuccessAt).getTime() : 0;
        return bTime - aTime;
      });

      setState({
        coupons: sortedCoupons,
        loading: false,
        error: null,
        domain: hostname,
      });
    } catch (error) {
      console.error('Error loading coupons:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCopy = (code: string): void => {
    setToast({
      show: true,
      message: `Code "${code}" copied to clipboard!`,
    });

    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2000);
  };

  const handleRetry = (): void => {
    loadCoupons();
  };

  const handleAutoApply = async (): Promise<void> => {
    if (state.coupons.length === 0 || autoApplyState.isRunning) {
      return;
    }

    setAutoApplyState({ isRunning: true, error: null });

    try {
      // Get active tab
      const tab = await getCurrentTab();

      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Check if this is a restricted page
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
        throw new Error('Cannot auto-apply on Chrome internal pages. Please navigate to a regular website.');
      }

      // Send message to content script to start auto-apply
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          type: 'AUTO_APPLY_COUPONS',
          coupons: state.coupons,
        });
      } catch (error) {
        // Content script not loaded - try to inject it programmatically
        if (error instanceof Error && error.message.includes('Could not establish connection')) {
          throw new Error(
            'Extension not ready on this page. Please refresh the page and try again.'
          );
        }
        throw error;
      }

      if (!response.success) {
        throw new Error(response.error || 'Auto-apply failed');
      }

      console.log('[OpenCoupon] Auto-apply completed:', response.result);

      // Show success toast
      setToast({
        show: true,
        message: response.result.bestCoupon
          ? `Best: ${response.result.bestCoupon.code} - saved $${response.result.bestCoupon.discountAmount.toFixed(2)}`
          : 'No valid coupons found',
      });

      setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 3000);
    } catch (error) {
      console.error('[OpenCoupon] Auto-apply error:', error);
      setAutoApplyState({
        isRunning: false,
        error: error instanceof Error ? error.message : 'Failed to auto-apply coupons',
      });

      // Show error toast
      setToast({
        show: true,
        message: 'Auto-apply failed. Please try manually.',
      });

      setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 3000);
    } finally {
      setAutoApplyState((prev) => ({ ...prev, isRunning: false }));
    }
  };

  return (
    <div className="w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="OpenCoupon" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">OpenCoupon</h1>
              {state.domain && <p className="text-xs text-gray-500">{state.domain}</p>}
            </div>
          </div>
          <button
            onClick={loadCoupons}
            disabled={state.loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Refresh coupons"
          >
            <svg
              className={`w-5 h-5 ${state.loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[540px] overflow-y-auto">
        {state.loading && <LoadingState />}

        {!state.loading && state.error && <ErrorState error={state.error} onRetry={handleRetry} />}

        {!state.loading && !state.error && state.coupons.length === 0 && (
          <EmptyState domain={state.domain || undefined} />
        )}

        {!state.loading && !state.error && state.coupons.length > 0 && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                Found {state.coupons.length} coupon{state.coupons.length !== 1 ? 's' : ''} for this site
              </p>
            </div>

            {/* Auto-Apply Button */}
            <button
              onClick={handleAutoApply}
              disabled={autoApplyState.isRunning || state.coupons.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center justify-center gap-2 mb-4"
            >
              {autoApplyState.isRunning ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Testing Coupons...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Auto-Apply Best Coupon</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {autoApplyState.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Auto-apply failed</p>
                    <p className="text-xs mt-1">{autoApplyState.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Coupon Cards */}
            {state.coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} onCopy={handleCopy} />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
