import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { CHART_COLORS } from '../../constants/analyticsColors';

/**
 * Custom tooltip for the bar chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
        {payload[0].value} Leads
      </p>
    </div>
  );
};

/**
 * Bar chart displaying monthly lead counts for the last 6 months.
 */
const BarChartCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Monthly Leads Trend</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Monthly Leads Trend</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">New leads generated per month</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-gray-700" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-slate-500 dark:text-gray-400"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-slate-500 dark:text-gray-400"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }} />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count === maxCount ? CHART_COLORS.primary : `${CHART_COLORS.primary}99`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(BarChartCard);
