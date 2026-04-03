import type { ConceptDetailEntry } from '../../types';

interface Props {
  entries: ConceptDetailEntry[];
}

export default function WeightChart({ entries }: Props) {
  if (!entries || entries.length <= 1) {
    return <div className="weight-chart-empty">Sin historial de evolucion suficiente.</div>;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const points = sorted.map((e, i) => ({
    date: new Date(e.created_at),
    weight: i + 1,
  }));

  const svgWidth = 600;
  const svgHeight = 150;
  const padLeft = 40;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();
  const dateRange = maxDate - minDate || 1;
  const maxWeight = points[points.length - 1].weight;

  const x = (date: Date) => padLeft + ((date.getTime() - minDate) / dateRange) * chartW;
  const y = (w: number) => padTop + chartH - (w / maxWeight) * chartH;

  // Build step line path
  let pathD = `M ${x(points[0].date)} ${y(points[0].weight)}`;
  for (let j = 1; j < points.length; j++) {
    pathD += ` L ${x(points[j].date)} ${y(points[j - 1].weight)}`;
    pathD += ` L ${x(points[j].date)} ${y(points[j].weight)}`;
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#333" strokeWidth="1" />
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#333" strokeWidth="1" />
      <text x={padLeft - 5} y={padTop + chartH + 3} fill="#555" fontSize="10" textAnchor="end" fontFamily="Courier New">1</text>
      <text x={padLeft - 5} y={padTop + 5} fill="#555" fontSize="10" textAnchor="end" fontFamily="Courier New">{maxWeight}</text>
      <path d={pathD} fill="none" stroke="#f60" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.date)} cy={y(p.weight)} r="3" fill="#f60" />
      ))}
    </svg>
  );
}
