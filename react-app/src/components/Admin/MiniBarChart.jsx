/**
 * Lightweight, dependency-free vertical bar chart (flex + divs).
 * data: [{ label, value, fullLabel? }]. Purely presentational.
 */
export default function MiniBarChart({ data = [], color = '#d4001f', gradient = null, height = 210 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const showValues = data.length <= 12;

  return (
    <div className="flex items-end gap-1.5 w-full overflow-hidden" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0);
        return (
          <div
            key={i}
            title={`${d.fullLabel || d.label}: ${d.value}`}
            className="group flex-1 min-w-0 h-full flex flex-col items-center justify-end"
          >
            <span
              className={`text-[10px] font-bold text-gray-700 mb-1 leading-none ${showValues ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
            >
              {d.value}
            </span>
            <div
              className="w-full max-w-[46px] rounded-t-md transition-all duration-500 group-hover:opacity-80"
              style={{ height: `${pct}%`, background: gradient || color }}
            />
            <span className="text-[9px] text-gray-400 mt-1.5 w-full text-center truncate leading-tight">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
