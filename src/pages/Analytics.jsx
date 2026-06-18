import React from 'react';
import { BarChart3 } from 'lucide-react';
import useAnalytics from '../hooks/useAnalytics';
import AnalyticsFilters from '../components/analytics/AnalyticsFilters';
import StatsCards from '../components/analytics/StatsCards';
import PieChartCard from '../components/analytics/PieChartCard';
import FunnelChartCard from '../components/analytics/FunnelChartCard';
import BarChartCard from '../components/analytics/BarChartCard';
import LineChartCard from '../components/analytics/LineChartCard';
import RevenueChartCard from '../components/analytics/RevenueChartCard';
import LeadSourceChart from '../components/analytics/LeadSourceChart';
import SalesVelocityCard from '../components/analytics/SalesVelocityCard';
import ForecastCard from '../components/analytics/ForecastCard';
import ActivityHeatmap from '../components/analytics/ActivityHeatmap';
import TopPerformersCard from '../components/analytics/TopPerformersCard';
import EmptyAnalyticsState from '../components/analytics/EmptyAnalyticsState';

/**
 * Analytics Dashboard Page
 * Provides startup founders and sales teams with actionable insights.
 */
const Analytics = () => {
  const {
    dateRange,
    setDateRange,
    filteredLeads,
    // KPIs
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
    // Chart Data
    statusDistribution,
    monthlyLeads,
    conversionByMonth,
    revenueByMonth,
    leadSourceStats,
    funnelData,
    salesVelocity,
    forecastRevenue,
    topPerformers,
    activityHeatmapData,
  } = useAnalytics();

  // Show empty state if no leads at all
  if (!filteredLeads || filteredLeads.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-gray-900 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Dashboard</h1>
            </div>
            <p className="text-slate-500 dark:text-gray-400 ml-12">Track sales performance and growth trends.</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <AnalyticsFilters dateRange={dateRange} setDateRange={setDateRange} />
          </div>

          <EmptyAnalyticsState />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Dashboard</h1>
            </div>
            <p className="text-slate-500 dark:text-gray-400 ml-12">Track sales performance and growth trends.</p>
          </div>
        </div>

        {/* Date Filters */}
        <AnalyticsFilters dateRange={dateRange} setDateRange={setDateRange} />

        {/* KPI Summary Section */}
        <StatsCards
          totalLeads={totalLeads}
          totalLeadsGrowth={totalLeadsGrowth}
          conversionRate={conversionRate}
          conversionGrowth={conversionGrowth}
          pipelineValue={pipelineValue}
          pipelineGrowth={pipelineGrowth}
          wonRevenue={wonRevenue}
          revenueGrowth={revenueGrowth}
          avgSalesCycle={avgSalesCycle}
          salesCycleGrowth={salesCycleGrowth}
          lostRate={lostRate}
          lostRateGrowth={lostRateGrowth}
        />

        {/* Row 1: Pie Chart + Funnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PieChartCard data={statusDistribution} />
          <FunnelChartCard data={funnelData} />
        </div>

        {/* Row 2: Bar Chart + Line Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BarChartCard data={monthlyLeads} />
          <LineChartCard data={conversionByMonth} />
        </div>

        {/* Row 3: Revenue + Lead Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevenueChartCard data={revenueByMonth} />
          <LeadSourceChart data={leadSourceStats} />
        </div>

        {/* Row 4: Heatmap + Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActivityHeatmap data={activityHeatmapData} />
          <TopPerformersCard data={topPerformers} />
        </div>

        {/* Row 5: Forecast + Sales Velocity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ForecastCard data={forecastRevenue} />
          <SalesVelocityCard data={salesVelocity} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
