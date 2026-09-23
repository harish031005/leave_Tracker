/**
 * LeaveBalanceChart — a donut/ring chart showing used vs remaining leave days.
 * Uses Recharts PieChart with an inner radius to create the ring effect.
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function LeaveBalanceChart({ balance, total = 20 }) {
  const used = total - balance;
  const data = [
    { name: 'Used', value: used },
    { name: 'Remaining', value: balance },
  ];

  // Colors: used = muted slate, remaining = indigo gradient
  const COLORS = ['#E2E8F0', '#4F46E5'];

  return (
    <div className="card flex flex-col items-center">
      <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-4">
        Leave Balance
      </h3>

      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-primary">{balance}</span>
          <span className="text-xs text-secondary">days left</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo" />
          <span className="text-xs text-secondary">Remaining ({balance})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200" />
          <span className="text-xs text-secondary">Used ({used})</span>
        </div>
      </div>
    </div>
  );
}
