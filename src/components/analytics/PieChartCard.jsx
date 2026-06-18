import React, { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

/**
 * Custom active shape renderer for the doughnut chart.
 * Expands the active slice on hover.
 */
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 8} dy={0} textAnchor="middle" fill="currentColor" className="text-slate-900 dark:text-white text-2xl font-bold" style={{ fontSize: '24px', fontWeight: 700 }}>
        {value}
      </text>
      <text x={cx} y={cy + 14} dy={0} textAnchor="middle" fill="currentColor" className="text-slate-500 dark:text-gray-400" style={{ fontSize: '12px' }}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius - 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

/**
 * Custom tooltip for the pie chart.
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg p-3 min-w-[120px]">
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{data.name}</p>
      <p className="text-lg font-bold mt-1" style={{ color: data.payload.color }}>
        {data.value} Leads
      </p>
      <p className="text-xs text-slate-500 dark:text-gray-400">{data.payload.percentage}%</p>
    </div>
  );
};

/**
 * Custom legend renderer.
 */
const CustomLegend = ({ payload }) => {
  if (!payload) return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-gray-400">{entry.value}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-white">{entry.payload.value}</span>
            <span className="text-xs text-slate-400 dark:text-gray-500">({entry.payload.percentage}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Doughnut chart showing lead status distribution with animated active slice.
 */
const PieChartCard = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const totalLeads = data.reduce((sum, d) => sum + d.value, 0);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Lead Status Distribution</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Lead Status Distribution</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{totalLeads} total leads across all stages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                onMouseEnter={onPieEnter}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend payload={data.map((d) => ({ value: d.name, color: d.color, payload: d }))} />
      </div>
    </div>
  );
};

export default React.memo(PieChartCard);
