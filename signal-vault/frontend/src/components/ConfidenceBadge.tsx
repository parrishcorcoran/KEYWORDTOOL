interface ConfidenceBadgeProps {
  confidence: string
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const labels: Record<string, { label: string; color: string }> = {
    very_high: { label: 'Very High', color: 'text-emerald bg-emerald/[0.08] border-emerald/[0.12]' },
    high: { label: 'High', color: 'text-emerald bg-emerald/[0.08] border-emerald/[0.12]' },
    medium: { label: 'Medium', color: 'text-amber bg-amber/[0.08] border-amber/[0.12]' },
    low: { label: 'Low', color: 'text-rose/80 bg-rose/[0.06] border-rose/[0.1]' },
    very_low: { label: 'Very Low', color: 'text-rose/80 bg-rose/[0.06] border-rose/[0.1]' },
  }

  const { label, color } = labels[confidence] || labels.low

  return (
    <span className={`${color} text-[10px] font-mono px-2 py-0.5 rounded-md border`}>
      {label}
    </span>
  )
}
