export function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="skeleton h-5 w-36 mb-4" />
      <div className="skeleton h-3 w-52 mb-2.5" />
      <div className="skeleton h-3 w-28" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="skeleton h-8 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full rounded-lg" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  )
}
