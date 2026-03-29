interface MiniScoreBarProps {
  label: string
  value: number
}

export default function MiniScoreBar({ label, value }: MiniScoreBarProps) {
  const color = value >= 70 ? 'bg-emerald' : value >= 40 ? 'bg-amber' : 'bg-rose'
  const glow = value >= 70 ? 'shadow-[0_0_6px_rgba(52,211,153,0.3)]' : value >= 40 ? 'shadow-[0_0_6px_rgba(245,158,11,0.2)]' : ''

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className="text-text-muted w-20 text-right shrink-0 font-mono text-[10px] uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out ${glow}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-text-muted/70 w-7 text-right text-[11px]">{Math.round(value)}</span>
    </div>
  )
}
