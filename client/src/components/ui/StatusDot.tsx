export type StatusTone = 'green' | 'amber' | 'red' | 'slate';

const TONES: Record<StatusTone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
};

interface StatusDotProps {
  tone: StatusTone;
  pulse?: boolean;
}

export function StatusDot({ tone, pulse = false }: StatusDotProps) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${TONES[tone]}`}
        />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${TONES[tone]}`} />
    </span>
  );
}