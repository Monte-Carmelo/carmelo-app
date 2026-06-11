'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  fill?: string;
}

interface PieChartProps {
  data: DataPoint[];
  height?: number;
  width?: string | number;
  title?: string;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#00A499', // teal — marca
  '#1F4A45', // forest
  '#C8896B', // clay
  '#9CB7A4', // sage
  '#C68A2E', // warn
  '#5BC2BA', // teal-300
  '#63666A', // gray — marca
  '#B5453F', // danger
];

export function PieChart({
  data,
  height = 300,
  width = '100%',
  title,
  innerRadius = 0,
  outerRadius = 80,
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  return (
    <div style={{ width }}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data.map(item => ({
              name: item.name,
              value: item.value,
              fill: item.fill || colors[data.indexOf(item) % colors.length],
            }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill || colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}