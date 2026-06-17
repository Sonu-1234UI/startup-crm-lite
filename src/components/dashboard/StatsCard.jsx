import React from 'react';

/**
 * A card component to display a statistical metric.
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the statistic.
 * @param {string|number} props.value - The main value to display.
 * @param {React.ElementType} props.icon - The Lucide React icon component.
 * @param {string} props.change - The percentage change (e.g. "+12.5%").
 * @param {string} props.color - The Tailwind color class for the icon background/text (e.g., 'text-blue-600 bg-blue-100').
 * @returns {JSX.Element}
 */
const StatsCard = ({ title, value, icon: Icon, change, color }) => {
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-slate-500'}`}>
            {change}
          </span>
          <span className="text-slate-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
