import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MetricoolChartProps {
  data: Array<{
    date: string;
    value: number;
    fullDate: string;
  }>;
  title: string;
  type?: 'line' | 'bar';
  color?: string;
}

export function MetricoolChart({ data, title, type = 'line', color = '#2563eb' }: MetricoolChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Geen data beschikbaar</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {title}: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={color} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}