'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-6">
        <span className="text-4xl text-red-500">⚠️</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
      <p className="text-white/50 text-sm max-w-sm mb-8">
        An unexpected error occurred. We've been notified and are looking into it.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-xl bg-white text-[#12001F] font-semibold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
      >
        Try again
      </button>
    </div>
  );
}
