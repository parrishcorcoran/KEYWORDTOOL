interface ConfidenceBadgeProps {
  confidence: string
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const labels: Record<string, { label: string; color: string }> = {
    very_high: { label: 'Very High', color: 'text-emerald bg-emerald/10' },
    high: { label: 'High', color: 'text-emerald bg-emerald/10' },
    medium: { label: 'Medium', color: 'text-amber bg-amber/10' },
    low: { label: 'Low', color: 'text-rose bg-rose/10' },
    very_low: { label: 'Very Low', color: 'text-rose bg-rose/10' },
  }

  const { label, color } = labels[confidence] || labels.low

  return (
    <span className={`${color} text-xs font-mono px-2 py-0.5 rounded-md`}>
      {label}
    </span>
  )
}
