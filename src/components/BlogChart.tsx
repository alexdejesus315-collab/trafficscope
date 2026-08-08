import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface BlogChartProps {
  data: Record<string, any>[];
  type: 'bar' | 'line' | 'pie';
}

const COLORS = ['#6231C7', '#5461D8', '#4882E0', '#4244B8', '#3791A5'];

export function BlogChart({ data, type }: BlogChartProps) {
  if (!data?.length) return null;

  return (
    <div className="w-full h-72 my-6 bg-card border border-border rounded-2xl p-4 shadow-2xs">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}