interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const cls = score >= 70 ? 'score-gold' : score >= 40 ? 'score-amber' : 'score-rose'
  const sizeClass = size === 'lg' ? 'text-2xl px-4 py-2' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`score-badge ${cls} ${sizeClass}`}>
      {Math.round(score)}
    </span>
  )
}
