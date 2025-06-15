
interface OfflineBannerProps {
  show: boolean;
}

export function OfflineBanner({ show }: OfflineBannerProps) {
  if (!show) return null;
  return (
    <div className="bg-yellow-100 text-yellow-800 flex items-center px-4 py-2 text-sm font-medium justify-center w-full">
      <span className="animate-pulse">You are offline. Changes will sync when back online.</span>
    </div>
  );
}
