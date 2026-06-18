import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts';
import { CHART_COLORS } from '../../constants/analyticsColors';

/**
 * Custom dot renderer for line chart data points.
 */
const CustomDot = (props) => {
  const { cx, cy, value } = props;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={5}
      fill={CHART_COLORS.success}
      stroke="#fff"
      strokeWidth={2}
      className="dark:stroke-gray-800"
    />
  );
};

/**
 * Custom tooltip for the conversion line chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
      <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
        {payload[0].value}%
      </p>
    </div>
  );
};

/**
 * Line chart showing monthly conversion rate trends.
 */
const LineChartCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Conversion Trend</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Monthly Conversion Trend</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Win rate percentage per month</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={CHART_COLORS.success}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: CHART_COLORS.success, stroke: '#fff', strokeWidth: 3 }}
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(LineChartCard);
