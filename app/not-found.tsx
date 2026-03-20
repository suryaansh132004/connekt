import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner text-4xl">
        🔍
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-white/50 text-sm max-w-sm mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-[#7CFF8A] text-[#12001F] font-semibold text-sm hover:shadow-[0_0_20px_rgba(122,255,136,0.4)] transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}
