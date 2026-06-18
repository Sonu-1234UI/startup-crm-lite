import { useMemo, useState, useCallback } from 'react';
import { useLeads } from '../context/LeadContext';
import {
  filterLeadsByDateRange,
  getPreviousPeriodLeads,
  calculateGrowth,
  getStatusDistribution,
  getMonthlyLeads,
  getConversionByMonth,
  getRevenueByMonth,
  getPipelineValue,
  getWonRevenue,
  getAverageSalesCycle,
  getLostRate,
  getLeadSourceStats,
  getFunnelData,
  getSalesVelocity,
  getForecastRevenue,
  getTopPerformers,
  getActivityHeatmapData,
} from '../utils/analyticsHelpers';

/**
 * Custom hook that provides all analytics computations from lead data.
 * Uses useMemo for performance optimization with large datasets.
 */
const useAnalytics = () => {
  const { leads } = useLeads();
  const [dateRange, setDateRange] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Filter leads by selected date range
  const filteredLeads = useMemo(
    () => filterLeadsByDateRange(leads, dateRange),
    [leads, dateRange]
  );

  // Previous period leads for comparison
  const previousPeriodLeads = useMemo(
    () => getPreviousPeriodLeads(leads, dateRange),
    [leads, dateRange]
  );

  // KPI Metrics
  const totalLeads = useMemo(() => filteredLeads.length, [filteredLeads]);
  const previousTotalLeads = useMemo(() => previousPeriodLeads.length, [previousPeriodLeads]);
  const totalLeadsGrowth = useMemo(
    () => calculateGrowth(totalLeads, previousTotalLeads),
    [totalLeads, previousTotalLeads]
  );

  const conversionRate = useMemo(() => {
    if (filteredLeads.length === 0) return 0;
    const won = filteredLeads.filter((l) => l.status === 'Won').length;
    return parseFloat(((won / filteredLeads.length) * 100).toFixed(1));
  }, [filteredLeads]);

  const previousConversionRate = useMemo(() => {
    if (previousPeriodLeads.length === 0) return 0;
    const won = previousPeriodLeads.filter((l) => l.status === 'Won').length;
    return parseFloat(((won / previousPeriodLeads.length) * 100).toFixed(1));
  }, [previousPeriodLeads]);

  const conversionGrowth = useMemo(
    () => calculateGrowth(conversionRate, previousConversionRate),
    [conversionRate, previousConversionRate]
  );

  const pipelineValue = useMemo(
    () => getPipelineValue(filteredLeads),
    [filteredLeads]
  );
  const previousPipelineValue = useMemo(
    () => getPipelineValue(previousPeriodLeads),
    [previousPeriodLeads]
  );
  const pipelineGrowth = useMemo(
    () => calculateGrowth(pipelineValue, previousPipelineValue),
    [pipelineValue, previousPipelineValue]
  );

  const wonRevenue = useMemo(
    () => getWonRevenue(filteredLeads),
    [filteredLeads]
  );
  const previousWonRevenue = useMemo(
    () => getWonRevenue(previousPeriodLeads),
    [previousPeriodLeads]
  );
  const revenueGrowth = useMemo(
    () => calculateGrowth(wonRevenue, previousWonRevenue),
    [wonRevenue, previousWonRevenue]
  );

  const avgSalesCycle = useMemo(
    () => getAverageSalesCycle(filteredLeads),
    [filteredLeads]
  );
  const previousAvgSalesCycle = useMemo(
    () => getAverageSalesCycle(previousPeriodLeads),
    [previousPeriodLeads]
  );
  const salesCycleGrowth = useMemo(
    () => calculateGrowth(avgSalesCycle, previousAvgSalesCycle),
    [avgSalesCycle, previousAvgSalesCycle]
  );

  const lostRate = useMemo(
    () => getLostRate(filteredLeads),
    [filteredLeads]
  );
  const previousLostRate = useMemo(
    () => getLostRate(previousPeriodLeads),
    [previousPeriodLeads]
  );
  const lostRateGrowth = useMemo(
    () => calculateGrowth(lostRate, previousLostRate),
    [lostRate, previousLostRate]
  );

  // Chart Data
  const statusDistribution = useMemo(
    () => getStatusDistribution(filteredLeads),
    [filteredLeads]
  );

  const monthlyLeads = useMemo(
    () => getMonthlyLeads(filteredLeads),
    [filteredLeads]
  );

  const conversionByMonth = useMemo(
    () => getConversionByMonth(filteredLeads),
    [filteredLeads]
  );

  const revenueByMonth = useMemo(
    () => getRevenueByMonth(filteredLeads),
    [filteredLeads]
  );

  const leadSourceStats = useMemo(
    () => getLeadSourceStats(filteredLeads),
    [filteredLeads]
  );

  const funnelData = useMemo(
    () => getFunnelData(filteredLeads),
    [filteredLeads]
  );

  const salesVelocity = useMemo(
    () => getSalesVelocity(filteredLeads),
    [filteredLeads]
  );

  const forecastRevenue = useMemo(
    () => getForecastRevenue(filteredLeads),
    [filteredLeads]
  );

  const topPerformers = useMemo(
    () => getTopPerformers(filteredLeads),
    [filteredLeads]
  );

  const activityHeatmapData = useMemo(
    () => getActivityHeatmapData(leads), // Use all leads for heatmap
    [leads]
  );

  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range);
  }, []);

  return {
    // State
    dateRange,
    setDateRange: handleDateRangeChange,
    isLoading,
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
  };
};

export default useAnalytics;
