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
            <p className="text-sm text-gray-600 mb-3">
              Found {state.coupons.length} coupon{state.coupons.length !== 1 ? 's' : ''} for this site
            </p>
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
