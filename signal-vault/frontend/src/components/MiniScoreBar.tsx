interface MiniScoreBarProps {
  label: string
  value: number
}

export default function MiniScoreBar({ label, value }: MiniScoreBarProps) {
  const color = value >= 70 ? 'bg-gold' : value >= 40 ? 'bg-amber' : 'bg-rose'

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-text-muted w-20 text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-text-muted w-8">{Math.round(value)}</span>
    </div>
  )
}
