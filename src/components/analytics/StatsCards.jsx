import React from 'react';
import { TrendingUp, TrendingDown, Users, Target, Wallet, DollarSign, Clock, XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsHelpers';

/**
 * Individual KPI card with value, icon, and trend indicator.
 */
const KpiCard = React.memo(({ title, value, icon: Icon, growth, suffix = '', prefix = '', color, invertGrowth = false }) => {
  const growthValue = parseFloat(growth) || 0;
  // For metrics like "Lost Rate" and "Sales Cycle", a decrease is good
  const isPositive = invertGrowth ? growthValue < 0 : growthValue > 0;
  const isNegative = invertGrowth ? growthValue > 0 : growthValue < 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <div className={`p-2.5 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {prefix}{value}{suffix}
      </h3>
      {growth !== undefined && growth !== null && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : isNegative ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : null}
          <span className={`text-xs font-semibold ${
            isPositive ? 'text-green-600 dark:text-green-400' :
            isNegative ? 'text-red-500 dark:text-red-400' :
            'text-slate-500 dark:text-gray-400'
          }`}>
            {growthValue >= 0 ? '+' : ''}{growthValue.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400 dark:text-gray-500">vs prev</span>
        </div>
      )}
    </div>
  );
});
KpiCard.displayName = 'KpiCard';

/**
 * Displays 6 KPI summary cards in a responsive grid.
 */
const StatsCards = ({
  totalLeads,
  totalLeadsGrowth,
  conversionRate,
  conversionGrowth,
  pipelineValue,
  pipelineGrowth,
  wonRevenue,
  revenueGrowth,
  avgSalesCycle,
  salesCycleGrowth,
  lostRate,
  lostRateGrowth,
}) => {
  const cards = [
    {
      title: 'Total Leads',
      value: totalLeads,
      icon: Users,
      growth: totalLeadsGrowth,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Conversion Rate',
      value: conversionRate,
      suffix: '%',
      icon: Target,
      growth: conversionGrowth,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      icon: Wallet,
      growth: pipelineGrowth,
      color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Won Revenue',
      value: formatCurrency(wonRevenue),
      icon: DollarSign,
      growth: revenueGrowth,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      title: 'Avg Sales Cycle',
      value: avgSalesCycle,
      suffix: ' Days',
      icon: Clock,
      growth: salesCycleGrowth,
      invertGrowth: true,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Lost Rate',
      value: lostRate,
      suffix: '%',
      icon: XCircle,
      growth: lostRateGrowth,
      invertGrowth: true,
      color: 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
};

export default React.memo(StatsCards);
