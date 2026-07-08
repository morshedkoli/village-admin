export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-border">
            <div className="animate-shimmer h-4 rounded-lg w-24 mb-3" />
            <div className="animate-shimmer h-8 rounded-lg w-32 mb-2" />
            <div className="animate-shimmer h-3 rounded-lg w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="animate-shimmer h-6 rounded-lg w-40 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-shimmer h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
