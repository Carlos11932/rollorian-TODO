interface StatPillProps {
  icon: string;
  value: number;
  label: string;
  color: string;
}

export function StatPill({ icon, value, label, color }: StatPillProps) {
  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className="font-bold">{value}</span>
      <span className="text-on-surface-variant/50">{label}</span>
    </span>
  );
}
