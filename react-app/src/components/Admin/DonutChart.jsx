/**
 * Lightweight, dependency-free donut (circle) chart with a legend below.
 * data: [{ label, value }]. Each slice is one stroked <circle> arc.
 */
const PALETTE = ['#d4001f', '#2563eb', '#f59e0b', '#059669', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

export default function DonutChart({ data = [], size = 190, thickness = 34 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;

  const lenOf = (v) => (total > 0 ? v / total : 0) * c;
  const segments = data.map((d, i) => {
    const len = lenOf(d.value);
    const before = data.slice(0, i).reduce((s, x) => s + lenOf(x.value), 0);
    const gap = Math.min(2.5, len * 0.12);   // thin white separator between slices
    return {
      color: PALETTE[i % PALETTE.length],
      dash: Math.max(len - gap, 0.001),
      offset: -before,
      label: d.label,
      value: d.value,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f2f4" strokeWidth={thickness} />
        {total > 0 && segments.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${c - s.dash}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span style={{ background: s.color, width: 11, height: 11, borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
            <span className="text-gray-600 truncate max-w-30" title={s.label}>{s.label}</span>
            <span className="font-bold text-gray-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
