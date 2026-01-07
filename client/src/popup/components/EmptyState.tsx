interface EmptyStateProps {
  domain?: string;
}

export default function EmptyState({ domain }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coupons Available</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs">
        {domain
          ? `We don't have any coupon codes for ${domain} yet.`
          : 'No coupon codes are available for this website.'}
      </p>
      <div className="text-xs text-gray-500">
        <p>Check back later or help contribute by submitting codes you find!</p>
      </div>
    </div>
  );
}
