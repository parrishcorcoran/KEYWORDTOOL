interface TrendArrowProps {
  direction: string
  growth?: number
}

export default function TrendArrow({ direction, growth }: TrendArrowProps) {
  const config: Record<string, { arrow: string; color: string; bg: string }> = {
    exploding: { arrow: '\u2191\u2191', color: 'text-emerald', bg: 'bg-emerald/[0.08]' },
    growing: { arrow: '\u2191', color: 'text-emerald', bg: 'bg-emerald/[0.08]' },
    stable: { arrow: '\u2192', color: 'text-text-muted', bg: 'bg-white/[0.04]' },
    declining: { arrow: '\u2193', color: 'text-rose', bg: 'bg-rose/[0.06]' },
  }

  const { arrow, color, bg } = config[direction] || config.stable

  return (
    <span className={`${color} ${bg} font-mono text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg`}>
      {arrow}
      {growth !== undefined && (
        <span className="text-[10px]">{growth > 0 ? '+' : ''}{growth.toFixed(0)}%</span>
      )}
    </span>
  )
}
