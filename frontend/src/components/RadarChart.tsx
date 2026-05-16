type RadarAxis = {
  label: string;
  value: number;
};

type RadarChartProps = {
  axes: RadarAxis[];
  max?: number;
};

function polarPoint(cx: number, cy: number, radius: number, index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;

  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

export function RadarChart({ axes, max = 10 }: RadarChartProps) {
  const size = 320;
  const center = size / 2;
  const radius = 108;
  const levels = 4;

  const gridPolygons = Array.from({ length: levels }, (_, levelIndex) => {
    const ratio = (levelIndex + 1) / levels;
    const points = axes.map((_, axisIndex) => {
      const point = polarPoint(center, center, radius * ratio, axisIndex, axes.length);
      return `${point.x},${point.y}`;
    });

    return points.join(' ');
  });

  const valuePolygon = axes
    .map((axis, axisIndex) => {
      const clamped = Math.max(0, Math.min(max, axis.value));
      const point = polarPoint(center, center, radius * (clamped / max), axisIndex, axes.length);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <div className="radar-shell">
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart" role="img" aria-label="Диаграмма средних оценок книги">
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 220, 120, 0.48)" />
            <stop offset="100%" stopColor="rgba(242, 133, 63, 0.18)" />
          </linearGradient>
        </defs>

        {gridPolygons.map((polygon, index) => (
          <polygon
            key={polygon}
            points={polygon}
            className={index === gridPolygons.length - 1 ? 'radar-grid-outer' : 'radar-grid-inner'}
          />
        ))}

        {axes.map((axis, axisIndex) => {
          const point = polarPoint(center, center, radius + 22, axisIndex, axes.length);
          const linePoint = polarPoint(center, center, radius, axisIndex, axes.length);

          return (
            <g key={axis.label}>
              <line x1={center} y1={center} x2={linePoint.x} y2={linePoint.y} className="radar-axis-line" />
              <text x={point.x} y={point.y} className="radar-axis-label" textAnchor="middle">
                {axis.label}
              </text>
            </g>
          );
        })}

        <polygon points={valuePolygon} className="radar-value-area" />

        {axes.map((axis, axisIndex) => {
          const point = polarPoint(center, center, radius * (Math.max(0, Math.min(max, axis.value)) / max), axisIndex, axes.length);

          return <circle key={`${axis.label}-point`} cx={point.x} cy={point.y} r="4.5" className="radar-value-point" />;
        })}
      </svg>
    </div>
  );
}
