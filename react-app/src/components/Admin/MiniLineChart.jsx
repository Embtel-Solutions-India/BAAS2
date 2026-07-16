/**
 * Lightweight, dependency-free line/area chart.
 * data: [{ label, value, fullLabel? }]. Paths scale to the box; labels/dots are
 * HTML overlays so text stays crisp regardless of width.
 */
export default function MiniLineChart({ data = [], color = '#d4001f', height = 210, formatValue }) {
  const n = data.length;
  const max = Math.max(...data.map(d => d.value), 1);
  const showValues = n <= 12;
  const fmt = (v) => (formatValue ? formatValue(v) : v);

  const padX = 6;                 // viewBox x padding
  const top = 18, bottom = 82;    // viewBox y band (0..100)
  const xPct = (i) => (n <= 1 ? 50 : padX + (i / (n - 1)) * (100 - 2 * padX));
  const yVB = (v) => top + (1 - v / max) * (bottom - top);

  const pts = data.map((d, i) => [xPct(i), yVB(d.value)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const area = pts.length
    ? `${line} L${pts[pts.length - 1][0]},${bottom} L${pts[0][0]},${bottom} Z`
    : '';

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#lineAreaGrad)" stroke="none" />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
      </svg>

      {data.map((d, i) => {
        const leftPct = xPct(i);
        const topPx = (yVB(d.value) / 100) * height;
        return (
          <div key={i} title={`${d.fullLabel || d.label}: ${fmt(d.value)}`}>
            {/* dot */}
            <span style={{ position: 'absolute', left: `${leftPct}%`, top: topPx, width: 8, height: 8, background: '#fff', border: `2px solid ${color}`, borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
            {/* value */}
            {showValues && (
              <span style={{ position: 'absolute', left: `${leftPct}%`, top: topPx - 16, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{fmt(d.value)}</span>
            )}
            {/* x label */}
            <span style={{ position: 'absolute', left: `${leftPct}%`, top: height - 15, transform: 'translateX(-50%)', fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
