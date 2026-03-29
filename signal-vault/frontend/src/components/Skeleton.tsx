export function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="skeleton h-5 w-32 mb-3" />
      <div className="skeleton h-3 w-48 mb-2" />
      <div className="skeleton h-3 w-24" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full" />
      ))}
    </div>
  )
}
