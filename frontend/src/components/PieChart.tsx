// src/components/PieChart.tsx
import React from "react";

type PieProps = {
  data: { label: string; value: number }[];
  size?: number;
};

const PieChart: React.FC<PieProps> = ({ data, size = 220 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2;

  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No data available for this time range.
      </div>
    );
  }

  let cumulative = 0;
  const colors = [
    "#10B981", // Passed
    "#F97316", // Failed
    "#EF4444", // Locked Out
    "#3B82F6", // Not Started
  ];

  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * Math.PI * 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * Math.PI * 2;

    const x1 = radius + radius * Math.cos(startAngle - Math.PI / 2);
    const y1 = radius + radius * Math.sin(startAngle - Math.PI / 2);
    const x2 = radius + radius * Math.cos(endAngle - Math.PI / 2);
    const y2 = radius + radius * Math.sin(endAngle - Math.PI / 2);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const path = `
      M ${radius} ${radius}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;

    return {
      path,
      color: colors[i % colors.length],
      label: d.label,
      value: d.value,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, idx) => (
        <path
          key={idx}
          d={s.path}
          fill={s.color}
          stroke="#fff"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};

export default PieChart;
