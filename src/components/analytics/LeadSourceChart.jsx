import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { SOURCE_COLORS } from '../../constants/analyticsColors';

/**
 * Custom tooltip for lead source chart.
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{data.source}</p>
      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
        {data.count} Leads
      </p>
      <p className="text-xs text-slate-500 dark:text-gray-400">{data.percentage}% of total</p>
    </div>
  );
};

/**
 * Horizontal bar chart showing lead distribution by source.
 * Sorted in descending order by count.
 */
const LeadSourceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Lead Sources</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Lead Sources</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Where your leads are coming from</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-gray-700" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-slate-500 dark:text-gray-400"
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="source"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-slate-500 dark:text-gray-400"
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
              barSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={SOURCE_COLORS[entry.source] || '#6B7280'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(LeadSourceChart);
