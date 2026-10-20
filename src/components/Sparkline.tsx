interface SparklineProps {
  points: number[];
  label: string;
  class?: string;
}

/** A six-point, hand-drawn career shape used on the anonymous case cover. */
export function Sparkline({ points, label, class: cls = '' }: SparklineProps) {
  const w = 320;
  const h = 92;
  const padX = 8;
  const padY = 9;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(1, max - min);
  const xy = points.map((value, i) => {
    const x = padX + (i * (w - padX * 2)) / (points.length - 1);
    const y = h - padY - ((value - min) / span) * (h - padY * 2);
    return [x, y] as const;
  });

  // A gentle quadratic curve through the points; no library needed.
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 1; i < xy.length; i += 1) {
    const [px, py] = xy[i - 1];
    const [x, y] = xy[i];
    const mx = (px + x) / 2;
    const my = (py + y) / 2;
    d += ` Q${px.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    if (i === xy.length - 1) d += ` T${x.toFixed(1)} ${y.toFixed(1)}`;
  }

  return (
    <figure class={`dx-spark ${cls}`}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        <g class="dx-spark-grid">
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="0" x2={w} y1={padY + (i * (h - padY * 2)) / 3} y2={padY + (i * (h - padY * 2)) / 3} />
          ))}
          <line class="dx-spark-axis" x1={padX} x2={padX} y1={padY} y2={h - padY} />
          <line class="dx-spark-axis" x1={padX} x2={w - padX} y1={h - padY} y2={h - padY} />
        </g>
        <path class="dx-spark-line" d={d} filter="url(#pencil)" />
        {xy.map(([x, y], i) => (
          <circle key={i} class="dx-spark-dot" cx={x} cy={y} r={i === 0 || i === xy.length - 1 ? 3 : 2.4} />
        ))}
      </svg>
      <figcaption>
        <span>デビュー</span>
        <span class="dx-spark-mid">キャリアの形</span>
        <span>引退</span>
      </figcaption>
    </figure>
  );
}
