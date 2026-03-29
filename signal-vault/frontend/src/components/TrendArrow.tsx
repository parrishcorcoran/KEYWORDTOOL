interface TrendArrowProps {
  direction: string
  growth?: number
}

export default function TrendArrow({ direction, growth }: TrendArrowProps) {
  const config: Record<string, { arrow: string; color: string }> = {
    exploding: { arrow: '\u2191\u2191', color: 'text-emerald' },
    growing: { arrow: '\u2191', color: 'text-emerald' },
    stable: { arrow: '\u2192', color: 'text-amber' },
    declining: { arrow: '\u2193', color: 'text-rose' },
  }

  const { arrow, color } = config[direction] || config.stable

  return (
    <span className={`${color} font-mono text-sm inline-flex items-center gap-1`}>
      {arrow}
      {growth !== undefined && (
        <span className="text-xs">{growth > 0 ? '+' : ''}{growth.toFixed(0)}%</span>
      )}
    </span>
  )
}
